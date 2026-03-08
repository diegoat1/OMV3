@echo off
title Omega Medicina - Stop Servers
color 0C

echo ============================================
echo    OMEGA MEDICINA - Stopping Servers
echo ============================================
echo.

:: Detener procesos de Python (Flask)
echo [STOPPING] Backend Flask...
taskkill /F /IM python.exe /T >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Backend detenido
) else (
    echo [INFO] No habia backend ejecutandose
)

:: Detener procesos de Node (Expo)
echo [STOPPING] Frontend Expo...
taskkill /F /IM node.exe /T >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Frontend detenido
) else (
    echo [INFO] No habia frontend ejecutandose
)

echo.
echo ============================================
echo    Todos los servidores detenidos
echo ============================================
echo.
pause
