@echo off
setlocal
cd /d "%~dp0"
echo Roadora v6.9.1 deploymentfix wordt toegepast...
if not exist "index.html" (
  echo FOUT: plaats deze bestanden eerst in de hoofdmap van Roadora.
  pause
  exit /b 1
)
if not exist "api\geocode.js" (
  echo FOUT: api\geocode.js ontbreekt. Er is niets verwijderd.
  pause
  exit /b 1
)
if exist "api\app-config.js" (
  del /f /q "api\app-config.js"
  if exist "api\app-config.js" (
    echo FOUT: api\app-config.js kon niet worden verwijderd.
    pause
    exit /b 1
  )
  echo Verwijderd: api\app-config.js
) else (
  echo api\app-config.js was al verwijderd.
)
echo Klaar. Roadora gebruikt nu exact 12 Vercel Functions.
del /f /q "%~f0" >nul 2>&1
endlocal
