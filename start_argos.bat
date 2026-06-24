@echo off
title ARGOS IDE Server
cd /d "C:\Users\Daniyal\ARGOS"

echo ==============================================
echo       ARGOS IDE - Hardware Server Bootup      
echo ==============================================
echo.
echo Starting Next.js background engine...

:: Start the npm server in the background (minimized)
start /min cmd /c "npm run dev"

echo Waiting for local server to initialize on port 3000...
ping 127.0.0.1 -n 6 > nul

echo Launching ARGOS IDE...
start chrome "http://localhost:3000"

exit
