@echo off
echo ============================================
echo   Vditor Desktop - Windows Build Script
echo ============================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [1/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencies already installed, skipping...
)

echo.
echo [2/3] Building Windows executable...
echo.

:: Build without code signing (avoids winCodeSign download issues)
call npx electron-builder --win dir --config.win.signAndEditExecutable=false

if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    echo.
    echo If you see network errors, try setting a proxy:
    echo   set HTTPS_PROXY=http://your-proxy:port
    echo.
    echo Or try building NSIS installer (requires winCodeSign):
    echo   npx electron-builder --win nsis
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Build complete!
echo.
echo ============================================
echo   Output: dist\win-unpacked\
echo   Executable: dist\win-unpacked\Vditor Desktop.exe
echo ============================================
echo.
echo You can run the app directly from:
echo   dist\win-unpacked\Vditor Desktop.exe
echo.
echo To create an installer (NSIS), run:
echo   npx electron-builder --win nsis --config.win.signAndEditExecutable=false
echo.
pause
