@echo off
echo Limpiando procesos Node.js...
taskkill /F /IM node.exe >nul 2>&1

echo Limpiando cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo Iniciando servidor en puerto 3000...
set PORT=3000
npm run dev