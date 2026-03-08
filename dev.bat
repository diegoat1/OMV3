@echo off
title Omega Medicina - Development Server
color 0A
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "APP=%ROOT%omega-medicina-app"
set "EXPO_NO_DEPENDENCY_VALIDATION=true"

echo ============================================
echo    OMEGA MEDICINA - Development Server
echo ============================================
echo.

where python >nul 2>nul || (echo [ERROR] Python no encontrado.& pause& exit /b 1)
where node >nul 2>nul || (echo [ERROR] Node.js no encontrado.& pause& exit /b 1)

echo [OK] Python encontrado
echo [OK] Node.js encontrado
echo.

REM --- Menu inicial ---
echo  Selecciona el modo de inicio:
echo.
echo    [1] Normal        - Inicio rapido (cache intacto)
echo    [2] Clear         - Limpia cache de Metro
echo    [3] Deep Clean    - Borra caches locales + clear
echo    [4] Solo Backend  - Solo Flask (sin Expo)
echo    [5] Solo Frontend - Solo Expo (sin Flask)
echo.
choice /C 12345 /N /M "  Opcion (1-5): "
set "MODE=%ERRORLEVEL%"
echo.

REM --- Arranque inicial Backend ---
if "%MODE%"=="5" goto :init_skip_backend
call :start_backend
:init_skip_backend

REM --- Arranque inicial Frontend ---
if "%MODE%"=="4" goto :init_skip_frontend
if "%MODE%"=="3" (
    call :start_frontend deep
) else if "%MODE%"=="2" (
    call :start_frontend clear
) else (
    call :start_frontend normal
)
:init_skip_frontend

call :show_status
goto :control_loop

REM ============================================
REM   LOOP DE CONTROL PERSISTENTE
REM ============================================
:control_loop
echo.
echo  ---- Panel de Control ----
echo.
echo    [1] Reiniciar Backend
echo    [2] Reiniciar Frontend (normal)
echo    [3] Reiniciar Frontend (clear)
echo    [4] Reiniciar Frontend (deep clean)
echo    [5] Reiniciar TODO (normal)
echo    [6] Reiniciar TODO (clear)
echo    [7] Detener TODO y salir
echo.
choice /C 1234567 /N /M "  Opcion (1-7): "
set "OPT=%ERRORLEVEL%"
echo.

if "%OPT%"=="1" (
    call :stop_backend
    call :start_backend
    call :show_status
)
if "%OPT%"=="2" (
    call :stop_frontend
    call :start_frontend normal
    call :show_status
)
if "%OPT%"=="3" (
    call :stop_frontend
    call :start_frontend clear
    call :show_status
)
if "%OPT%"=="4" (
    call :stop_frontend
    call :start_frontend deep
    call :show_status
)
if "%OPT%"=="5" (
    call :stop_backend
    call :stop_frontend
    call :start_backend
    call :start_frontend normal
    call :show_status
)
if "%OPT%"=="6" (
    call :stop_backend
    call :stop_frontend
    call :start_backend
    call :start_frontend clear
    call :show_status
)
if "%OPT%"=="7" (
    call :stop_backend
    call :stop_frontend
    echo.
    echo [OK] Servidores detenidos. Hasta luego!
    timeout /t 2 >nul
    exit /b 0
)

goto :control_loop

REM ============================================
REM   FUNCIONES
REM ============================================

:start_backend
echo [STARTING] Backend Flask (puerto 8000)...
start "OMV3 Backend - Flask" cmd /k "cd /d %ROOT% && python src/main.py"
timeout /t 2 /nobreak >nul
goto :eof

:stop_backend
echo [STOPPING] Backend Flask...
taskkill /FI "WINDOWTITLE eq OMV3 Backend - Flask*" /T /F >nul 2>nul
timeout /t 1 /nobreak >nul
echo [OK] Backend detenido
goto :eof

:start_frontend
set "FMODE=%~1"
if "%FMODE%"=="deep" (
    echo [DEEP CLEAN] Borrando caches locales de Expo...
    if exist "%APP%\.expo" rmdir /s /q "%APP%\.expo"
    if exist "%APP%\node_modules\.cache" rmdir /s /q "%APP%\node_modules\.cache"
    echo [STARTING] Expo con --clear...
    start "OMV3 Frontend - Expo" cmd /k "cd /d %APP% && set EXPO_NO_DEPENDENCY_VALIDATION=true&& npx expo start --web --port 8081 --clear"
) else if "%FMODE%"=="clear" (
    echo [STARTING] Expo con --clear...
    start "OMV3 Frontend - Expo" cmd /k "cd /d %APP% && set EXPO_NO_DEPENDENCY_VALIDATION=true&& npx expo start --web --port 8081 --clear"
) else (
    echo [STARTING] Expo normal...
    start "OMV3 Frontend - Expo" cmd /k "cd /d %APP% && set EXPO_NO_DEPENDENCY_VALIDATION=true&& npx expo start --web --port 8081"
)
goto :eof

:stop_frontend
echo [STOPPING] Frontend Expo...
taskkill /FI "WINDOWTITLE eq OMV3 Frontend - Expo*" /T /F >nul 2>nul
timeout /t 1 /nobreak >nul
echo [OK] Frontend detenido
goto :eof

:show_status
echo.
echo ============================================
echo    Servidores activos
echo ============================================
echo    Backend Flask:  http://localhost:8000
echo    API v3:         http://localhost:8000/api/v3
echo    Frontend Expo:  http://localhost:8081
echo ============================================
goto :eof
