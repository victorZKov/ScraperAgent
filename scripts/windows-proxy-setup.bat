@echo off
REM ============================================================
REM  ScraperAgent Twitter Proxy - Windows Setup
REM
REM  This script sets up a lightweight HTTP proxy on this PC
REM  and creates an SSH reverse tunnel to the Scaleway server.
REM
REM  The Scaleway server will route Twitter requests through
REM  this PC's residential IP to avoid rate limiting.
REM
REM  Requirements:
REM    - OpenSSH (built into Windows 10/11)
REM    - Internet connection
REM    - SSH key configured for root@your-scaleway-server
REM ============================================================

set SCALEWAY_HOST=51.159.100.175
set PROXY_PORT=8888
set TUNNEL_PORT=8888

echo.
echo ==========================================
echo  ScraperAgent Twitter Proxy Setup
echo ==========================================
echo.

REM Check if proxy directory exists
if not exist "%USERPROFILE%\scraperagent-proxy" (
    echo Creating proxy directory...
    mkdir "%USERPROFILE%\scraperagent-proxy"
)

REM Check if 3proxy exists, if not download it
if not exist "%USERPROFILE%\scraperagent-proxy\3proxy.exe" (
    echo.
    echo 3proxy not found. Please download it manually:
    echo   1. Go to https://github.com/3proxy/3proxy/releases
    echo   2. Download the latest Windows x64 zip
    echo   3. Extract 3proxy.exe to: %USERPROFILE%\scraperagent-proxy\
    echo.
    pause
    exit /b 1
)

REM Create 3proxy config
echo Creating proxy configuration...
(
echo # 3proxy config for ScraperAgent
echo nscache 65536
echo log "%USERPROFILE%\scraperagent-proxy\proxy.log" D
echo logformat "- +_L%t.%. %N.%p %E %C:%c %R:%r %O %I %h %T"
echo auth none
echo # Only allow connections from localhost (SSH tunnel)
echo allow * 127.0.0.1
echo deny *
echo proxy -p%PROXY_PORT% -i127.0.0.1
) > "%USERPROFILE%\scraperagent-proxy\3proxy.cfg"

echo.
echo Starting 3proxy on 127.0.0.1:%PROXY_PORT%...
start /B "" "%USERPROFILE%\scraperagent-proxy\3proxy.exe" "%USERPROFILE%\scraperagent-proxy\3proxy.cfg"
timeout /t 2 /nobreak >nul

echo.
echo Creating SSH reverse tunnel to %SCALEWAY_HOST%...
echo   Local proxy 127.0.0.1:%PROXY_PORT% will be available as
echo   localhost:%TUNNEL_PORT% on the Scaleway server.
echo.
echo Press Ctrl+C to stop the tunnel.
echo.

ssh -N -R %TUNNEL_PORT%:127.0.0.1:%PROXY_PORT% root@%SCALEWAY_HOST% -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes

echo.
echo Tunnel disconnected. Stopping proxy...
taskkill /IM 3proxy.exe /F >nul 2>&1
echo Done.
