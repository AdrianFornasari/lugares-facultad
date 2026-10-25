@echo off
cd /d "%~dp0"
call npm install
if errorlevel 1 (
 echo No se pudieron instalar las dependencias. Se necesita acceso a npm.
 pause
 exit /b 1
)
call npm run dev
pause
