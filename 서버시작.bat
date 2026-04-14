@echo off
title Dev Server (Port 8000)
cd /d "%~dp0"
echo.
echo ========================================
echo  Starting dev server...
echo  URL: http://localhost:8000
echo  Stop: Ctrl + C  or close this window
echo ========================================
echo.
start "" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0_open_browser.ps1"
call npm run dev
echo.
echo Server stopped. Press any key to close.
pause > nul
