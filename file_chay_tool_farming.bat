@echo off
cd /d "%~dp0"

call npm install  >nul 2>&1

call node app.js
pause