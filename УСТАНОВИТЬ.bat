@echo off
chcp 65001 >nul
title Harant MCP Server - Setup

echo.
echo Harant MCP Server - setup and verification
echo.

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed.
    echo Download Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Running verification...
call npm run verify
if errorlevel 1 (
    echo [ERROR] Verification failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Ready.
echo.
echo Local development:
echo   npm run dev
echo.
echo Local MCP URL:
echo   http://localhost:3000/api/mcp
echo.
echo Vercel MCP URL:
echo   https://your-project.vercel.app/api/mcp
echo.
pause
