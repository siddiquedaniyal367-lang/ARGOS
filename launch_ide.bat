@echo off
title ARGOS IDE Server
cd /d "C:\Users\Daniyal\ARGOS"

echo Installing dependencies (if needed)...
call npm install

echo Starting Next.js Server...
start /B cmd /c "npm run dev"

echo Waiting for server to initialize (7 seconds)...
timeout /t 7 /nobreak > NUL

echo Launching ARGOS IDE in standalone mode...
start chrome.exe --app="http://localhost:3000"
exit
