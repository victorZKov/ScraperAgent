# Setup Script for Backup System
# Run this once to install dependencies and configure scheduled task

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

Write-Host "=================================="
Write-Host "ScraperAgent Backup System Setup"
Write-Host "=================================="

# Check if Docker is running
Write-Host ""
Write-Host "[1/5] Checking Docker..."
try {
    docker ps | Out-Null
    Write-Host "  [OK] Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker first."
    exit 1
}

# Check if rclone is installed
Write-Host ""
Write-Host "[2/5] Checking rclone..."
if (Get-Command rclone -ErrorAction SilentlyContinue) {
    $rcloneVersion = rclone version | Select-Object -First 1
    Write-Host "  [OK] rclone is installed: $rcloneVersion"
} else {
    Write-Host "  [!] rclone is not installed"
    Write-Host ""
    Write-Host "Please install rclone first:"
    Write-Host "  Option 1: Run .\install-tools.ps1 (as Administrator)"
    Write-Host "  Option 2: Download from https://rclone.org/downloads/"
    Write-Host "  Option 3: Use winget: winget install Rclone.Rclone"
    Write-Host ""
    $install = Read-Host "Install rclone now? (y/n)"
    if ($install -eq 'y') {
        & "$PSScriptRoot\install-tools.ps1"
        Write-Host "Please close and reopen PowerShell, then run setup again."
        exit 0
    } else {
        Write-Error "rclone is required for backups. Please install it and run setup again."
        exit 1
    }
}

# Check configuration file
Write-Host ""
Write-Host "[3/5] Checking configuration..."
$configFile = Join-Path $PSScriptRoot ".env.backup"
if (Test-Path $configFile) {
    Write-Host "  [OK] Configuration file exists"

    # Check if credentials are set
    $content = Get-Content $configFile -Raw
    if ($content -match 'tu_access_key_aqui|tu_secret_key_aqui') {
        Write-Warning "  [!] You need to update ScaleWay credentials in .env.backup"
        Write-Host ""
        Write-Host "Please edit the file: $configFile"
        Write-Host "And replace the following values:"
        Write-Host "  - SCALEWAY_ACCESS_KEY"
        Write-Host "  - SCALEWAY_SECRET_KEY"
        Write-Host "  - SCALEWAY_BUCKET (optional, default: scraperagent-backups)"

        $continue = Read-Host "`nHave you updated the credentials? (y/n)"
        if ($continue -ne 'y') {
            Write-Host "Please update the credentials and run this script again."
            exit 1
        }
    } else {
        Write-Host "  [OK] Credentials appear to be configured"
    }
} else {
    Write-Error "Configuration file not found: $configFile"
    exit 1
}

# Test backup (dry run)
Write-Host ""
Write-Host "[4/5] Testing backup configuration..."
try {
    Write-Host "  Running test backup..."
    & "$PSScriptRoot\run-backup.ps1" -ConfigFile $configFile
    Write-Host "  [OK] Test backup completed successfully"
} catch {
    Write-Error "Test backup failed: $_"
    Write-Host "Please check your configuration and try again."
    exit 1
}

# Create scheduled task
Write-Host ""
Write-Host "[5/5] Setting up scheduled task..."
$taskName = "ScraperAgent-Backup"
$taskDescription = "Automated backup of ScraperAgent database every 8 hours"
$scriptPath = Join-Path $PSScriptRoot "run-backup.ps1"

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "  Removing existing task..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create trigger for every 8 hours
$trigger = @(
    New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 8)
)

# Create action
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

# Create task settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Register the task
Register-ScheduledTask -TaskName $taskName -Description $taskDescription -Trigger $trigger -Action $action -Settings $settings -RunLevel Highest -Force | Out-Null

Write-Host "  [OK] Scheduled task created: $taskName"
Write-Host "    Runs every 8 hours starting from now"

Write-Host ""
Write-Host "=================================="
Write-Host "Setup completed successfully!"
Write-Host "=================================="
Write-Host ""
Write-Host "Next backup will run in 8 hours."
Write-Host "You can run a manual backup anytime with:"
Write-Host "  .\run-backup.ps1"
Write-Host ""
Write-Host "To view scheduled task:"
Write-Host "  Get-ScheduledTask -TaskName '$taskName'"
Write-Host ""
Write-Host "To run backup now:"
Write-Host "  Start-ScheduledTask -TaskName '$taskName'"
