@echo off
REM واٹس اپ سرور شروع کریں
REM WhatsApp Server Starter

echo.
echo ========================================
echo   واٹس اپ سرور شروع ہو رہا ہے...
echo ========================================
echo.

REM چیک کریں کہ Node.js انسٹال ہے یا نہیں
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js انسٹال نہیں ہے!
    echo.
    echo براہ کرم Node.js انسٹال کریں: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js ملا!
echo.

REM npm dependencies انسٹال کریں
echo ⏳ منحصرات انسٹال ہو رہے ہیں...
cd /d "%~dp0"
call npm install

echo.
echo ✅ منحصرات انسٹال ہو گئے!
echo.
echo ========================================
echo   سرور شروع ہو رہا ہے...
echo ========================================
echo.
echo 🌐 واٹس اپ API: http://localhost:3001
echo.
echo براہ کرم اپنے براؤزر میں کھولیں:
echo http://localhost/whatsapp-connect.html
echo.
echo Admin Dashboard:
echo http://localhost/admin/whatsapp-dashboard.php
echo.
echo Ctrl+C دبائیں سرور بند کرنے کے لیے
echo.

REM Server شروع کریں
node server.js

pause
