# Main Backup Script - Orchestrates backup and upload
# This script should be scheduled to run every 8 hours

param(
    [string]$ConfigFile = "$PSScriptRoot\.env.backup"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================="
Write-Host "ScraperAgent Backup Process"
Write-Host "Started at: $(Get-Date)"
Write-Host "=================================="

try {
    # Step 1: Create PostgreSQL backup
    Write-Host "`n[1/2] Creating PostgreSQL backup..."
    $backupPath = & "$PSScriptRoot\backup-postgres.ps1" -ConfigFile $ConfigFile

    if (!$backupPath -or !(Test-Path $backupPath)) {
        throw "Backup creation failed - no backup file was created"
    }

    # Step 2: Upload to ScaleWay
    Write-Host "`n[2/2] Uploading backup to ScaleWay..."
    & "$PSScriptRoot\upload-to-scaleway-rclone.ps1" -ConfigFile $ConfigFile -BackupFile $backupPath

    Write-Host "`n=================================="
    Write-Host "Backup process completed successfully!"
    Write-Host "Finished at: $(Get-Date)"
    Write-Host "=================================="

    # Log success
    $logFile = Join-Path $PSScriptRoot "backup-log.txt"
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Backup completed successfully" | Add-Content $logFile

    exit 0
} catch {
    Write-Error "`nBackup process failed: $_"

    # Log error
    $logFile = Join-Path $PSScriptRoot "backup-log.txt"
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Backup FAILED: $_" | Add-Content $logFile

    exit 1
}
