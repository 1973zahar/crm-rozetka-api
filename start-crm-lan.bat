@echo off
setlocal
cd /d "%~dp0"
echo Starting Arms CRM for LAN access...
echo.
echo Your local addresses:
ipconfig | findstr /R /C:"IPv4"
echo.
echo Open on this computer:
echo http://127.0.0.1:8787/index.html
echo.
echo Other people on the same Wi-Fi/LAN should open:
echo http://YOUR_IPV4_ADDRESS:8787/index.html
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0mock-api.ps1" -Port 8787 -BindAddress 0.0.0.0
pause
