@echo off
chcp 65001 >nul
title CompBench 竞品对比台
echo ============================================
echo   CompBench 竞品对比台 - 本地服务
echo ============================================
echo.
echo 正在启动后端服务...
echo 启动后请在浏览器打开: http://127.0.0.1:8787/compbench.html
echo.
echo 当前为免登录模式：打开网页即可直接使用全部功能。
echo 停止服务：在本窗口按 Ctrl+C
echo.
echo 【将来启用工号登录】把下一行改成: set AUTH_ENABLED=1
echo.
cd /d "%~dp0"
set AUTH_ENABLED=0
node server/server.js
pause
