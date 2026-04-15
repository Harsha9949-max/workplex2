@echo off
REM ============================================================
REM WorkPlex Deep Clean Script (Windows)
REM Deletes node_modules, .vite cache, and dist folders
REM Then performs a fresh npm install
REM ============================================================

echo.
echo ========================================
echo   WorkPlex Deep Clean
echo ========================================
echo.

echo [1/4] Removing node_modules...
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo       Done.
) else (
    echo       Skipped (not found).
)

echo [2/4] Removing .vite cache...
if exist ".vite" (
    rmdir /s /q ".vite"
    echo       Done.
) else (
    echo       Skipped (not found).
)

echo [3/4] Removing dist folder...
if exist "dist" (
    rmdir /s /q "dist"
    echo       Done.
) else (
    echo       Skipped (not found).
)

echo [4/4] Running fresh npm install...
echo.
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed!
    echo Try running: npm install --force
    exit /b 1
)

echo.
echo ========================================
echo   Deep Clean Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Start the dev server:  npm run dev
echo   2. Open browser to:       http://localhost:2532
echo   3. If issues persist, check:
echo      - Node.js version (run: node --version)
echo      - Network/proxy settings
echo      - DevTools Console for errors
echo.
