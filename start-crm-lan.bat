@echo off
setlocal
cd /d "%~dp0"
echo Starting Marketplace CRM for LAN access...
echo.
echo Your local addresses:
ipconfig | findstr /R /C:"IPv4"
echo.
echo Open on this computer:
echo http://127.0.0.1:8789/index.html
echo.
echo Other people on the same Wi-Fi/LAN should open one of these exact URLs:
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4"') do (
  for /f "tokens=* delims= " %%B in ("%%A") do echo http://%%B:8789/index.html
)
echo.
echo If Windows Firewall asks, allow access for Private networks.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0mock-api.ps1" -Port 8789 -BindAddress 0.0.0.0
pause
