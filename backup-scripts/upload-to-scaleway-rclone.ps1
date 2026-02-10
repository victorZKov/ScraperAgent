# Upload Backup to ScaleWay Object Storage using rclone
# Simpler and more reliable than AWS CLI

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

# Check if rclone is installed
if (!(Get-Command rclone -ErrorAction SilentlyContinue)) {
    Write-Error "rclone is not installed. Please run .\install-tools.ps1 first"
    exit 1
}

if (!$BackupFile -or !(Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

$fileName = Split-Path $BackupFile -Leaf
$remotePath = "scaleway:$($env:SCALEWAY_BUCKET)/backups/$fileName"

Write-Host "Uploading backup to ScaleWay Object Storage..."
Write-Host "Bucket: $($env:SCALEWAY_BUCKET)"
Write-Host "File: $fileName"

try {
    # Configure rclone for ScaleWay (create config on the fly)
    $rcloneConfig = @"
[scaleway]
type = s3
provider = Scaleway
access_key_id = $($env:SCALEWAY_ACCESS_KEY)
secret_access_key = $($env:SCALEWAY_SECRET_KEY)
region = $($env:SCALEWAY_REGION)
endpoint = s3.$($env:SCALEWAY_REGION).scw.cloud
acl = private
"@

    $configPath = Join-Path $PSScriptRoot "rclone.conf"
    $rcloneConfig | Set-Content -Path $configPath -Force

    # Upload file
    $fileSize = (Get-Item $BackupFile).Length / 1MB
    Write-Host "File size: $([math]::Round($fileSize, 2)) MB"

    rclone copy $BackupFile "scaleway:$($env:SCALEWAY_BUCKET)/backups/" --config $configPath --progress

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Upload completed successfully!"
    } else {
        throw "Upload failed with exit code $LASTEXITCODE"
    }

    # Clean up old backups from ScaleWay (keep last N days)
    Write-Host "Cleaning up old backups from ScaleWay (keeping last $($env:BACKUP_RETENTION_DAYS) days)..."
    $cutoffDate = (Get-Date).AddDays(-[int]$env:BACKUP_RETENTION_DAYS).ToString("yyyy-MM-dd")

    # List all backups
    $backups = rclone lsl "scaleway:$($env:SCALEWAY_BUCKET)/backups/" --config $configPath |
        ForEach-Object {
            if ($_ -match '^\s*\d+\s+(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}\.\d+\s+(.+)$') {
                [PSCustomObject]@{
                    Date = [DateTime]::Parse($matches[1])
                    Name = $matches[2]
                }
            }
        }

    $oldBackups = $backups | Where-Object { $_.Date -lt $cutoffDate }
    foreach ($backup in $oldBackups) {
        Write-Host "Deleting old backup: $($backup.Name)"
        rclone delete "scaleway:$($env:SCALEWAY_BUCKET)/backups/$($backup.Name)" --config $configPath
    }

    Write-Host "Remote cleanup completed!"

} catch {
    Write-Error "Upload failed: $_"
    exit 1
} finally {
    # Clean up rclone config (contains credentials)
    if (Test-Path $configPath) {
        Remove-Item $configPath -Force
    }
}

# Clean up local old backups
Write-Host "Cleaning up local old backups..."
$cutoffDate = (Get-Date).AddDays(-[int]$env:BACKUP_RETENTION_DAYS)
$localBackups = Get-ChildItem -Path $env:BACKUP_LOCAL_PATH -Filter "postgres_backup_*.dump" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt $cutoffDate }

foreach ($backup in $localBackups) {
    Write-Host "Deleting local backup: $($backup.Name)"
    Remove-Item $backup.FullName -Force
}

Write-Host "All cleanup tasks completed!"
