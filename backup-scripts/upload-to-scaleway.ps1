# Upload Backup to ScaleWay Object Storage
# Uses AWS CLI (S3 compatible) to upload backups to ScaleWay

param(
    [string]$ConfigFile = "$PSScriptRoot\.env.backup",
    [string]$BackupFile
)

# Load environment variables
if (Test-Path $ConfigFile) {
    Get-Content $ConfigFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.+)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Error "Configuration file not found: $ConfigFile"
    exit 1
}

# Check if AWS CLI is installed
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed. Please install it first:"
    Write-Error "https://aws.amazon.com/cli/"
    exit 1
}

# Configure AWS CLI for ScaleWay
$env:AWS_ACCESS_KEY_ID = $env:SCALEWAY_ACCESS_KEY
$env:AWS_SECRET_ACCESS_KEY = $env:SCALEWAY_SECRET_KEY
$s3Endpoint = "https://s3.$($env:SCALEWAY_REGION).scw.cloud"

if (!$BackupFile -or !(Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

$fileName = Split-Path $BackupFile -Leaf
$s3Key = "backups/$fileName"

Write-Host "Uploading backup to ScaleWay Object Storage..."
Write-Host "Bucket: $($env:SCALEWAY_BUCKET)"
Write-Host "File: $fileName"

try {
    # Check if bucket exists, create if it doesn't
    $bucketCheck = aws s3 ls "s3://$($env:SCALEWAY_BUCKET)" --endpoint-url $s3Endpoint 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Bucket doesn't exist, creating..."
        aws s3 mb "s3://$($env:SCALEWAY_BUCKET)" --endpoint-url $s3Endpoint
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create bucket"
        }
    }

    # Upload file
    aws s3 cp $BackupFile "s3://$($env:SCALEWAY_BUCKET)/$s3Key" --endpoint-url $s3Endpoint

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Upload completed successfully!"

        # Clean up old backups (older than BACKUP_RETENTION_DAYS)
        Write-Host "Cleaning up old backups (keeping last $($env:BACKUP_RETENTION_DAYS) days)..."
        $cutoffDate = (Get-Date).AddDays(-[int]$env:BACKUP_RETENTION_DAYS)

        $backups = aws s3 ls "s3://$($env:SCALEWAY_BUCKET)/backups/" --endpoint-url $s3Endpoint | ForEach-Object {
            if ($_ -match '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\d+\s+(.+)$') {
                [PSCustomObject]@{
                    Date = [DateTime]::Parse($matches[1])
                    Name = $matches[2]
                }
            }
        }

        $oldBackups = $backups | Where-Object { $_.Date -lt $cutoffDate }
        foreach ($backup in $oldBackups) {
            Write-Host "Deleting old backup: $($backup.Name)"
            aws s3 rm "s3://$($env:SCALEWAY_BUCKET)/backups/$($backup.Name)" --endpoint-url $s3Endpoint
        }

        Write-Host "Backup cleanup completed!"
    } else {
        throw "Upload failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Error "Upload failed: $_"
    exit 1
}

# Clean up local old backups
Write-Host "Cleaning up local old backups..."
$localBackups = Get-ChildItem -Path $env:BACKUP_LOCAL_PATH -Filter "postgres_backup_*.sql.gz" |
    Where-Object { $_.LastWriteTime -lt $cutoffDate }

foreach ($backup in $localBackups) {
    Write-Host "Deleting local backup: $($backup.Name)"
    Remove-Item $backup.FullName -Force
}

Write-Host "All cleanup tasks completed!"
