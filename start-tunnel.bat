@echo off
title SoundWave Muzik Uygulamasi - Expo Server
cd /d "%~dp0"
echo ===================================================================
echo   SOUNDWAVE MUZIK UYGULAMASI (Expo Go - Tunnel Modu)
echo   Farkli aglardan / Mobil veriden QR kod ile baglanabilirsiniz.
echo ===================================================================
echo.
npx expo start --tunnel
pause
