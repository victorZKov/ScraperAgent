# Install Required Tools for Backup System
# This script installs rclone for uploading to ScaleWay

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

Write-Host "=================================="
Write-Host "Installing Backup Tools"
Write-Host "=================================="

# Install rclone using winget or download directly
Write-Host ""
Write-Host "Installing rclone..."

try {
    # Try winget first
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Installing rclone via winget..."
        winget install Rclone.Rclone --accept-package-agreements --accept-source-agreements
    } else {
        # Manual installation
        Write-Host "Downloading rclone..."
        $rcloneVersion = "v1.65.2"
        $rcloneUrl = "https://downloads.rclone.org/$rcloneVersion/rclone-$rcloneVersion-windows-amd64.zip"
        $downloadPath = "$env:TEMP\rclone.zip"
        $extractPath = "$env:TEMP\rclone"

        Invoke-WebRequest -Uri $rcloneUrl -OutFile $downloadPath
        Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force

        # Copy rclone.exe to a PATH location
        $installPath = "C:\Program Files\rclone"
        if (!(Test-Path $installPath)) {
            New-Item -ItemType Directory -Path $installPath -Force | Out-Null
        }

        Copy-Item "$extractPath\rclone-$rcloneVersion-windows-amd64\rclone.exe" "$installPath\rclone.exe" -Force

        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        if ($currentPath -notlike "*$installPath*") {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installPath", "Machine")
        }

        # Cleanup
        Remove-Item $downloadPath -Force
        Remove-Item $extractPath -Recurse -Force
    }

    # Refresh PATH in current session
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

    Write-Host "[OK] rclone installed successfully"
    $version = rclone version
    Write-Host $version

} catch {
    Write-Error "Failed to install rclone: $_"
    exit 1
}

Write-Host ""
Write-Host "=================================="
Write-Host "Installation completed!"
Write-Host "=================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Close and reopen PowerShell"
Write-Host "2. Run .\setup-backup.ps1 to configure backups"
