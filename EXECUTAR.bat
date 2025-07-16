@echo off
cls
echo ========================================
echo      🚗 POSTO VERDE CASHBACK 🚗
echo ========================================
echo.
echo Sistema SIMPLES e FUNCIONAL!
echo.

REM Verifica se as dependencias estao instaladas
if not exist "node_modules" (
    echo ❌ DEPENDENCIAS NAO ENCONTRADAS!
    echo.
    echo Execute primeiro o arquivo: INSTALAR.bat
    echo para instalar as dependencias necessarias.
    echo.
    pause
    exit /b 1
)

echo Iniciando servidor React...
echo.
echo ⏰ Aguarde... abrira em http://localhost:3000
echo.
echo 🔑 LOGINS:
echo    Cliente: joao@email.com / 123456
echo    Admin:   admin@posto.com / 123456
echo.
echo Para parar: pressione Ctrl+C
echo.

REM Muda para o diretorio atual do script
cd /d "%~dp0"
npm start

echo.
echo Aplicacao encerrada.
pause 