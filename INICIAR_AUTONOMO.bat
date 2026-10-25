@echo off
setlocal
cd /d "%~dp0"
echo Iniciando Navegador FCM...
where py >nul 2>&1
if not errorlevel 1 (
    py -3 "%~dp0iniciar_servidor.py"
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo ERROR: No se encontro Python.
        echo Instala Python o utiliza Live Server de Visual Studio Code en autonomo.
        pause
        exit /b 1
    )
    python "%~dp0iniciar_servidor.py"
)
if errorlevel 1 (
    echo.
    echo El servidor no pudo iniciarse. Lee el mensaje de error superior.
)
pause
