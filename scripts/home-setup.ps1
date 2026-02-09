# =============================================================
#  ScraperAgent Home Setup — Windows PowerShell
#
#  Run this from the repo root:
#    powershell -ExecutionPolicy Bypass -File scripts\home-setup.ps1
#
#  Prerequisites:
#    - Docker Desktop installed and running
#    - Git installed
#    - cloudflared installed (winget install Cloudflare.cloudflared)
# =============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ScraperAgent — Home Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Step 1: Check prerequisites ---
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Docker
try {
    $dockerVersion = docker --version 2>$null
    Write-Host "  Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Docker not found. Install Docker Desktop first." -ForegroundColor Red
    Write-Host "  https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
    exit 1
}

# Docker running?
try {
    docker info 2>$null | Out-Null
    Write-Host "  Docker Desktop: running" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Docker Desktop is not running. Start it first." -ForegroundColor Red
    exit 1
}

# cloudflared
try {
    $cfVersion = cloudflared --version 2>$null
    Write-Host "  cloudflared: $cfVersion" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "  cloudflared not found. Installing via winget..." -ForegroundColor Yellow
    winget install Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
    Write-Host "  cloudflared installed. You may need to restart this terminal." -ForegroundColor Green
}

# --- Step 2: Cloudflare login ---
Write-Host ""
Write-Host "[2/6] Cloudflare authentication..." -ForegroundColor Yellow
Write-Host "  This will open a browser for you to log in to Cloudflare." -ForegroundColor Gray
Write-Host "  Select the zone for scraperagent.eu" -ForegroundColor Gray
Write-Host ""

$loginChoice = Read-Host "  Already logged in? (y/N)"
if ($loginChoice -ne "y") {
    cloudflared tunnel login
}

# --- Step 3: Create tunnel ---
Write-Host ""
Write-Host "[3/6] Creating Cloudflare Tunnel..." -ForegroundColor Yellow

$tunnelName = "scraperagent"
$existingTunnel = cloudflared tunnel list 2>$null | Select-String $tunnelName
if ($existingTunnel) {
    Write-Host "  Tunnel '$tunnelName' already exists." -ForegroundColor Green
} else {
    cloudflared tunnel create $tunnelName
    Write-Host "  Tunnel '$tunnelName' created." -ForegroundColor Green
}

# --- Step 4: Configure DNS ---
Write-Host ""
Write-Host "[4/6] Setting up DNS route..." -ForegroundColor Yellow
Write-Host "  Pointing api.scraperagent.eu -> tunnel" -ForegroundColor Gray

try {
    cloudflared tunnel route dns $tunnelName api.scraperagent.eu
    Write-Host "  DNS route configured." -ForegroundColor Green
} catch {
    Write-Host "  DNS route may already exist (that's OK)." -ForegroundColor Yellow
}

# --- Step 5: Get tunnel token ---
Write-Host ""
Write-Host "[5/6] Getting tunnel token..." -ForegroundColor Yellow

$tunnelToken = cloudflared tunnel token $tunnelName 2>$null
if ($tunnelToken) {
    Write-Host "  Token retrieved." -ForegroundColor Green
} else {
    Write-Host "  ERROR: Could not get tunnel token." -ForegroundColor Red
    Write-Host "  Run manually: cloudflared tunnel token $tunnelName" -ForegroundColor Gray
    exit 1
}

# --- Step 6: Create .env ---
Write-Host ""
Write-Host "[6/6] Setting up .env file..." -ForegroundColor Yellow

$envFile = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envFile) {
    Write-Host "  .env already exists." -ForegroundColor Yellow
    $overwrite = Read-Host "  Overwrite with template? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "  Keeping existing .env. Updating tunnel token only..." -ForegroundColor Gray
        $envContent = Get-Content $envFile -Raw
        if ($envContent -match "CLOUDFLARE_TUNNEL_TOKEN=") {
            $envContent = $envContent -replace "CLOUDFLARE_TUNNEL_TOKEN=.*", "CLOUDFLARE_TUNNEL_TOKEN=$tunnelToken"
        } else {
            $envContent += "`nCLOUDFLARE_TUNNEL_TOKEN=$tunnelToken`n"
        }
        Set-Content $envFile $envContent -NoNewline
        Write-Host "  Tunnel token updated in .env" -ForegroundColor Green
    }
}

if (!(Test-Path $envFile) -or $overwrite -eq "y") {
    $templateFile = Join-Path $PSScriptRoot ".." ".env.home.template"
    if (Test-Path $templateFile) {
        $template = Get-Content $templateFile -Raw
        $template = $template -replace "CLOUDFLARE_TUNNEL_TOKEN=.*", "CLOUDFLARE_TUNNEL_TOKEN=$tunnelToken"
        Set-Content $envFile $template -NoNewline
        Write-Host "  .env created from template with tunnel token." -ForegroundColor Green
        Write-Host ""
        Write-Host "  IMPORTANT: Edit .env and fill in the remaining values:" -ForegroundColor Red
        Write-Host "    - ConnectionStrings__configdb  (Scaleway Managed PostgreSQL)" -ForegroundColor Gray
        Write-Host "    - AzureOpenAI__ApiKey" -ForegroundColor Gray
        Write-Host "    - Email__Smtp__Username / Password" -ForegroundColor Gray
        Write-Host "    - Finnhub__ApiKey" -ForegroundColor Gray
        Write-Host "    - Mollie__ApiKey" -ForegroundColor Gray
        Write-Host "    - ReportRecipients" -ForegroundColor Gray
    } else {
        Write-Host "  ERROR: .env.home.template not found." -ForegroundColor Red
        exit 1
    }
}

# --- Done ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "  1. Edit .env with your real credentials" -ForegroundColor White
Write-Host "  2. Make sure Scaleway PostgreSQL allows your home IP" -ForegroundColor White
Write-Host "     (check Scaleway console -> Managed DB -> Allowed IPs)" -ForegroundColor Gray
Write-Host "  3. Start everything:" -ForegroundColor White
Write-Host ""
Write-Host "     docker compose -f docker-compose.home.yml up -d --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Check logs:" -ForegroundColor White
Write-Host "     docker compose -f docker-compose.home.yml logs -f" -ForegroundColor Cyan
Write-Host ""
Write-Host "  5. Verify:" -ForegroundColor White
Write-Host "     curl https://api.scraperagent.eu/api/version" -ForegroundColor Cyan
Write-Host ""
