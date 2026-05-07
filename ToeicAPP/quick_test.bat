@echo off
echo ========================================
echo 托业学习助手 - 快速测试脚本
echo ========================================
echo.

echo 1. 检查文件完整性...
if exist index.html (
    echo   ✅ index.html 存在
) else (
    echo   ❌ index.html 缺失
)

if exist vocabulary_app.html (
    echo   ✅ vocabulary_app.html 存在
) else (
    echo   ❌ vocabulary_app.html 缺失
)

if exist practice_coach.html (
    echo   ✅ practice_coach.html 存在
) else (
    echo   ❌ practice_coach.html 缺失
)

if exist word_database.json (
    echo   ✅ word_database.json 存在
) else (
    echo   ❌ word_database.json 缺失
)

echo.
echo 2. 启动本地HTTP服务器...
echo   按 Ctrl+C 停止服务器
echo.
echo   访问地址: http://localhost:8000/index.html
echo   手机访问: http://[你的电脑IP]:8000/index.html
echo.

:: 检查Python是否可用
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo 使用Python启动服务器...
    python -m http.server 8000
) else (
    echo Python未找到，尝试其他方法...
    
    :: 检查Node.js是否可用
    where node >nul 2>nul
    if %errorlevel% equ 0 (
        echo 使用Node.js启动服务器...
        npx http-server -p 8000
    ) else (
        echo 未找到Python或Node.js，无法自动启动服务器
        echo.
        echo 请手动启动:
        echo   1. 安装Python: https://www.python.org/
        echo   2. 或安装Node.js: https://nodejs.org/
        echo   3. 或使用其他HTTP服务器工具
        pause
    )
)