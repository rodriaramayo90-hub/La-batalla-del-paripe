@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
  set "PYTHON=py"
) else (
  where python >nul 2>&1
  if errorlevel 1 (
    echo No se encontro Python. Instala Python o usa: py -m http.server 8765
    pause
    exit /b 1
  )
  set "PYTHON=python"
)
echo.
echo LA BATALLA DEL PARIPE - PREVIEW T-REX / LUCAS
echo Se inicia un servidor SOLO en este ordenador (127.0.0.1:8765).
echo Para detenerlo, cerra la ventana titulada "Servidor Paripé Preview".
echo.
start "Servidor Paripe Preview" cmd /k "%PYTHON% -m http.server 8765 --bind 127.0.0.1"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8765/preview-hitreactions-lucas-trex.html"
endlocal
