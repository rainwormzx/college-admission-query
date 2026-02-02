@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo =========================================
echo 高考志愿填报系统 - Railway部署准备
echo =========================================
echo.

:: 检查Git仓库
if not exist ".git" (
    echo ❌ 当前目录不是Git仓库
    echo 正在初始化Git仓库...
    git init
    echo ✅ Git仓库已初始化
) else (
    echo ✅ Git仓库已存在
)

:: 检查远程仓库
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('git remote get-url origin') do set remote_url=%%i
    echo ✅ 已配置远程仓库: !remote_url!
) else (
    echo ⚠️  未配置远程仓库
    echo.
    echo 请按以下步骤操作：
    echo 1. 在GitHub创建新仓库: https://github.com/new
    echo 2. 仓库名建议: college-admission-query
    echo 3. 创建后运行: git remote add origin https://github.com/你的用户名/college-admission-query.git
    echo.
    set /p has_repo="是否已创建GitHub仓库？(y/n): "
    if /i "!has_repo!"=="y" (
        set /p github_username="请输入你的GitHub用户名: "
        git remote add origin "https://github.com/!github_username!/college-admission-query.git"
        echo ✅ 远程仓库已配置
    ) else (
        echo ❌ 请先创建GitHub仓库后再运行此脚本
        pause
        exit /b 1
    )
)

:: 检查文件状态
echo.
echo 检查文件状态...
git status --short

:: 添加所有文件
echo.
echo 添加文件到Git...
git add .
echo ✅ 文件已添加

:: 提交
echo.
set /p commit_msg="请输入提交信息 (默认: Prepare for Railway deployment): "
if "!commit_msg!"=="" set commit_msg=Prepare for Railway deployment
git commit -m "!commit_msg!"
echo ✅ 文件已提交

:: 推送到GitHub
echo.
echo 推送到GitHub...
git push -u origin main
if %errorlevel% equ 0 (
    echo ✅ 代码已成功推送到GitHub
) else (
    echo ⚠️  推送失败，可能需要手动推送
    echo 请运行: git push -u origin main
)

:: 下一步指引
echo.
echo =========================================
echo ✅ 部署准备完成！
echo =========================================
echo.
echo 下一步操作：
echo.
echo 📝 部署后端到Railway:
echo    1. 访问: https://railway.app/
echo    2. 点击: New Project → Deploy from GitHub repo
echo    3. 选择仓库: college-admission-query
echo    4. 设置Root Directory: backend
echo    5. 添加PostgreSQL数据库
echo    6. 配置环境变量:
echo       - DATABASE_URL (从数据库服务复制)
echo       - NODE_ENV=production
echo       - PORT=3000
echo.
echo 📝 部署前端到Vercel:
echo    1. 访问: https://vercel.com/
echo    2. 点击: New Project
echo    3. 选择仓库: college-admission-query
echo    4. 设置Root Directory: frontend
echo    5. 配置环境变量:
echo       - VITE_API_URL=你的Railway后端地址
echo.
echo 📊 导入数据:
echo    方法1: 使用Railway CLI (推荐)
echo    - 安装: npm install -g @railway/cli
echo    - 连接: railway proxy
echo    - 导入: python scripts/import-excel.py
echo.
echo    方法2: 创建导入API
echo    - 参考文档: RAILWAY_DEPLOYMENT.md
echo.
echo 📖 详细文档: RAILWAY_DEPLOYMENT.md
echo.
echo =========================================
pause
