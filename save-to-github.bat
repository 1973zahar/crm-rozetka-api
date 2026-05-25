@echo off

cd /d D:\Codex\CRM\crm-rozetka-full-api

echo =========================
echo Git Status
echo =========================
git status

echo.
echo =========================
echo Adding files
echo =========================
git add .

echo.
echo =========================
echo Commit
echo =========================
git commit -m "Auto update"

echo.
echo =========================
echo Push to GitHub
echo =========================
git push

echo.
echo =========================
echo Done
echo =========================

pause