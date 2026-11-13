@echo off
setlocal
cd /d "%~dp0"
set "PY="
where py >nul 2>&1
if not errorlevel 1 set "PY=py"
if "%PY%"=="" (
 where python >nul 2>&1
 if not errorlevel 1 set "PY=python"
)
if "%PY%"=="" (
 echo No se encontro Python. Instala Python para iniciar la beta local.
 pause
 exit /b 1
)
echo La Batalla del Paripe - BETA 3, Lucas vs T-Rex
echo Servidor de prueba en este ordenador: http://127.0.0.1:8767/
echo No se publica ni modifica el juego original.
start "Paripe Beta 3 servidor" cmd /k "%PY% -m http.server 8767 --bind 127.0.0.1"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8767/preview-hitreactions-lucas-trex-v3.html"
endlocal
