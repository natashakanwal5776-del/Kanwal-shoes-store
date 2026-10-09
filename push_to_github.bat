@echo off
title GitHub Push - Kanwal Shoes Store
echo ===============================================
echo  Kanwal Shoes Store - Push to GitHub
echo ===============================================
echo.
cd /d "d:\kanwal shoes store\kanwal-shoes-store"
set PATH=C:\mingit\cmd;%PATH%
echo Running: git push -u origin main
echo.
git push -u origin main
echo.
pause
