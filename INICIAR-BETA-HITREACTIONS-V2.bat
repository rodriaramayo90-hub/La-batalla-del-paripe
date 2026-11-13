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
  echo ERROR: Python no encontrado. Instalalo o ejecuta un servidor HTTP local.
  pause
  exit /b 1
)
echo INICIANDO LA BETA 2 DE T-REX VS LUCAS
echo Esta prueba solo se abre en tu PC. La web principal no se modifica.
start "Servidor Beta 2 - Paripe" cmd /k "%PY% -m http.server 8766 --bind 127.0.0.1"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8766/preview-hitreactions-lucas-trex-v2.html"
endlocal
