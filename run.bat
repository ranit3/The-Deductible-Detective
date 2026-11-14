@echo off
title The Loss Adjuster - Forensic Investigation Bureau
echo ========================================================
echo   Starting The Loss Adjuster (Vite + TypeScript + 3D)...
echo ========================================================
echo.
echo Opening investigation portal at http://localhost:3000 ...
echo (Press Ctrl+C in this terminal window to stop the server)
echo.

start "" "http://localhost:3000"
call npm.cmd run dev
pause
