# Restore PostgreSQL Backup from ScaleWay
# Downloads and restores a specific backup

param(
    [string]$ConfigFile = "$PSScriptRoot\.env.backup",
    [string]$BackupFile,
    [switch]$ListBackups,
    [switch]$Latest
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

# Configure AWS CLI for ScaleWay
$env:AWS_ACCESS_KEY_ID = $env:SCALEWAY_ACCESS_KEY
$env:AWS_SECRET_ACCESS_KEY = $env:SCALEWAY_SECRET_KEY
$s3Endpoint = "https://s3.$($env:SCALEWAY_REGION).scw.cloud"

# List available backups
if ($ListBackups) {
    Write-Host "Available backups in ScaleWay:"
    Write-Host "=============================="
    aws s3 ls "s3://$($env:SCALEWAY_BUCKET)/backups/" --endpoint-url $s3Endpoint
    exit 0
}

# Get latest backup
if ($Latest) {
    Write-Host "Finding latest backup..."
    $backups = aws s3 ls "s3://$($env:SCALEWAY_BUCKET)/backups/" --endpoint-url $s3Endpoint |
        Where-Object { $_ -match 'postgres_backup_' } |
        Sort-Object -Descending |
        Select-Object -First 1

    if ($backups -match 'postgres_backup_\d+_\d+\.sql\.gz') {
        $BackupFile = $matches[0]
        Write-Host "Latest backup: $BackupFile"
    } else {
        Write-Error "No backups found"
        exit 1
    }
}

if (!$BackupFile) {
    Write-Host "Usage:"
    Write-Host "  .\restore-backup.ps1 -ListBackups              # List all available backups"
    Write-Host "  .\restore-backup.ps1 -Latest                   # Restore latest backup"
    Write-Host "  .\restore-backup.ps1 -BackupFile <filename>    # Restore specific backup"
    exit 1
}

$restoreDir = Join-Path $env:BACKUP_LOCAL_PATH "restore"
if (!(Test-Path $restoreDir)) {
    New-Item -ItemType Directory -Path $restoreDir -Force | Out-Null
}

$localBackupPath = Join-Path $restoreDir $BackupFile
$s3Key = "backups/$BackupFile"

Write-Host "`n=================================="
Write-Host "Restoring backup: $BackupFile"
Write-Host "=================================="

# Download backup from ScaleWay
Write-Host "`n[1/3] Downloading backup from ScaleWay..."
try {
    aws s3 cp "s3://$($env:SCALEWAY_BUCKET)/$s3Key" $localBackupPath --endpoint-url $s3Endpoint

    if ($LASTEXITCODE -ne 0) {
        throw "Download failed"
    }

    $fileSize = (Get-Item $localBackupPath).Length / 1MB
    Write-Host "  ✓ Downloaded successfully: $([math]::Round($fileSize, 2)) MB"
} catch {
    Write-Error "Failed to download backup: $_"
    exit 1
}

# Confirm restoration
Write-Host "`n[2/3] WARNING: This will replace the current database!"
$confirm = Read-Host "Are you sure you want to restore this backup? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Restoration cancelled"
    exit 0
}

# Restore backup
Write-Host "`n[3/3] Restoring database..."
try {
    # Stop the application container first
    Write-Host "  Stopping application container..."
    docker stop scraperagent-api-1 2>$null

    # Drop and recreate database
    Write-Host "  Recreating database..."
    docker exec $env:POSTGRES_CONTAINER psql -U $env:POSTGRES_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$($env:POSTGRES_DB)' AND pid <> pg_backend_pid();" 2>$null
    docker exec $env:POSTGRES_CONTAINER psql -U $env:POSTGRES_USER -c "DROP DATABASE IF EXISTS $($env:POSTGRES_DB);"
    docker exec $env:POSTGRES_CONTAINER psql -U $env:POSTGRES_USER -c "CREATE DATABASE $($env:POSTGRES_DB);"

    # Restore from backup
    Write-Host "  Restoring from backup file..."
    Get-Content $localBackupPath -Raw | docker exec -i $env:POSTGRES_CONTAINER pg_restore -U $env:POSTGRES_USER -d $env:POSTGRES_DB --format=custom

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Database restored successfully!"
    } else {
        throw "pg_restore failed with exit code $LASTEXITCODE"
    }

    # Restart application container
    Write-Host "  Restarting application container..."
    docker start scraperagent-api-1

    Write-Host "`n=================================="
    Write-Host "Restoration completed successfully!"
    Write-Host "=================================="
} catch {
    Write-Error "Restoration failed: $_"
    Write-Host "Restarting application container..."
    docker start scraperagent-api-1
    exit 1
}

# Clean up
Write-Host "`nCleaning up downloaded backup file..."
Remove-Item $localBackupPath -Force
Write-Host "Done!"
