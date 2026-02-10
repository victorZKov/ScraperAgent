# PostgreSQL Backup Script for ScaperAgent
# This script creates incremental backups and uploads to ScaleWay Object Storage

param(
    [string]$ConfigFile = "$PSScriptRoot\.env.backup"
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

# Variables
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = $env:BACKUP_LOCAL_PATH
$backupFile = "postgres_backup_$timestamp.sql.gz"
$backupPath = Join-Path $backupDir $backupFile

# Create backup directory if it doesn't exist
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "Created backup directory: $backupDir"
}

Write-Host "Starting PostgreSQL backup at $(Get-Date)"
Write-Host "Backup file: $backupFile"

# Create backup using docker exec and pg_dump
try {
    # Create backup inside container first
    $containerBackupPath = "/tmp/backup_$timestamp.dump"
    $pgDumpCmd = "PGPASSWORD=$($env:POSTGRES_PASSWORD) pg_dump -U $($env:POSTGRES_USER) -d $($env:POSTGRES_DB) --format=custom --compress=9 -f $containerBackupPath"

    Write-Host "Executing backup command in container..."
    docker exec $env:POSTGRES_CONTAINER bash -c $pgDumpCmd

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }

    # Copy backup from container to host
    Write-Host "Copying backup from container to host..."
    docker cp "${env:POSTGRES_CONTAINER}:$containerBackupPath" $backupPath

    if ($LASTEXITCODE -ne 0) {
        throw "docker cp failed with exit code $LASTEXITCODE"
    }

    # Clean up backup file from container
    docker exec $env:POSTGRES_CONTAINER rm $containerBackupPath

    # Verify backup file exists and has content
    if (Test-Path $backupPath) {
        $fileSize = (Get-Item $backupPath).Length / 1MB
        if ($fileSize -gt 0) {
            Write-Host "Backup completed successfully! Size: $([math]::Round($fileSize, 2)) MB"
            # Return the backup file path for the upload script
            return $backupPath
        } else {
            throw "Backup file is empty"
        }
    } else {
        throw "Backup file was not created"
    }
} catch {
    Write-Error "Backup failed: $_"
    exit 1
}
