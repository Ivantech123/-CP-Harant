@echo off
chcp 65001 >nul
title Harant MCP Server - Установка

echo.
echo ╔══════════════════════════════════════════╗
echo ║     Harant MCP Server - Установка       ║
echo ╚══════════════════════════════════════════╝
echo.

:: Проверка Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Node.js не установлен!
    echo Скачайте с https://nodejs.org/ и запустите снова.
    pause
    exit /b 1
)

echo [1/3] Установка зависимостей...
call npm install
if errorlevel 1 (
    echo [ОШИБКА] Не удалось установить зависимости
    pause
    exit /b 1
)

echo.
echo [2/3] Сборка проекта...
call npm run build
if errorlevel 1 (
    echo [ОШИБКА] Не удалось собрать проект
    pause
    exit /b 1
)

echo.
echo [3/3] Настройка конфигурации для Gemini...

:: Получаем текущую директорию
set CURRENT_DIR=%~dp0
set CURRENT_DIR=%CURRENT_DIR:~0,-1%

:: Создаём конфиг для Claude Desktop
set CLAUDE_CONFIG=%APPDATA%\Claude\claude_desktop_config.json
if not exist "%APPDATA%\Claude" mkdir "%APPDATA%\Claude"

echo {> "%CLAUDE_CONFIG%"
echo   "mcpServers": {>> "%CLAUDE_CONFIG%"
echo     "harant": {>> "%CLAUDE_CONFIG%"
echo       "command": "node",>> "%CLAUDE_CONFIG%"
echo       "args": ["%CURRENT_DIR:\=\\%\\dist\\index.js"]>> "%CLAUDE_CONFIG%"
echo     }>> "%CLAUDE_CONFIG%"
echo   }>> "%CLAUDE_CONFIG%"
echo }>> "%CLAUDE_CONFIG%"

echo.
echo ╔══════════════════════════════════════════╗
echo ║           ✅ ГОТОВО!                     ║
echo ╚══════════════════════════════════════════╝
echo.
echo Путь к серверу:
echo   %CURRENT_DIR%\dist\index.js
echo.
echo Для Gemini добавьте в настройки MCP:
echo   Command: node
echo   Args:    %CURRENT_DIR%\dist\index.js
echo.
echo Для Claude Desktop конфиг уже создан автоматически.
echo.
pause
