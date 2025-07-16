@echo off
cls
echo ========================================
echo      🚗 POSTO VERDE CASHBACK 🚗
echo          INSTALADOR AUTOMATICO
echo ========================================
echo.
echo Este script ira instalar todas as dependencias
echo necessarias para rodar a aplicacao.
echo.
echo ⏰ Aguarde... isso pode levar alguns minutos...
echo.

REM Verifica se o Node.js esta instalado
echo Verificando Node.js...
call node --version
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

REM Verifica se o npm esta instalado
echo Verificando npm...
call npm --version
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: npm nao encontrado!
    echo.
    echo O npm deveria vir com o Node.js.
    echo Reinstale o Node.js: https://nodejs.org/
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo ✅ Node.js encontrado!
echo ✅ npm encontrado!
echo.

REM Muda para o diretorio do projeto
cd /d "%~dp0"

echo 📦 Instalando dependencias...
echo.

REM Instala as dependencias do React
call npm install

echo.
echo 📦 Instalando dependencias do servidor...
echo.

REM Instala as dependencias do servidor (se necessario)
call npm install bcryptjs sqlite3 express cors @types/bcryptjs @types/sqlite3 @types/express @types/cors

echo.
echo Verificando instalacao...
echo.

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo        ✅ INSTALACAO CONCLUIDA! ✅
    echo ========================================
    echo.
    echo O projeto esta pronto para usar!
    echo.
    echo Para executar a aplicacao:
    echo   🚀 Execute o arquivo: EXECUTAR.bat
    echo.
    echo Ou digite: npm start
    echo.
    echo 🌐 A aplicacao abrira em: http://localhost:3000
    echo.
    echo 🔑 LOGINS DE TESTE:
    echo    Cliente: joao@email.com / 123456
    echo    Admin:   admin@posto.com / 123456
    echo.
) else (
    echo.
    echo ❌ ERRO durante a instalacao!
    echo.
    echo Verifique sua conexao com a internet
    echo e tente novamente.
    echo.
)

echo.
echo ========================================
echo    INSTALACAO FINALIZADA!
echo ========================================
echo.
echo PROXIMOS PASSOS:
echo 1. Execute: TESTAR-SISTEMA.bat (opcional)
echo 2. Execute: CONFIGURAR-BANCO.bat
echo 3. Execute: EXECUTAR-SERVIDOR.bat
echo 4. Execute: EXECUTAR.bat
echo.
echo Pressione qualquer tecla para continuar...
pause >nul 