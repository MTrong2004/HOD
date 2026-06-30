@echo off
title Tu dong Link va Chay Vercel Dev
echo ==========================================
echo      DANG LIEN KET DU AN VOI VERCEL...
echo ==========================================
echo.

:: Tự động link và chọn "Yes" cho các tùy chọn mặc định
call vercel link --yes

echo.
echo ==========================================
echo      DANG KHOI DONG VERCEL DEV...
echo ==========================================
echo.

:: Chạy vercel dev
call vercel dev

pause