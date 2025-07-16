const { initDatabase } = require('./server/database');

async function configurarBanco() {
    try {
        console.log('🗄️  Configurando banco de dados SQLite...');
        console.log('');
        
        await initDatabase();
        
        console.log('');
        console.log('========================================');
        console.log('        ✅ BANCO CONFIGURADO! ✅');
        console.log('========================================');
        console.log('');
        console.log('📋 CREDENCIAIS PADRÃO:');
        console.log('   Admin: CPF 000.000.000-00');
        console.log('   Senha: Admin123');
        console.log('');
        console.log('🗃️  Arquivo: server/posto_cashback.db');
        console.log('');
        console.log('🎯 PRÓXIMOS PASSOS:');
        console.log('1. Execute: EXECUTAR-SERVIDOR.bat');
        console.log('2. Execute: EXECUTAR.bat');
        console.log('');
        console.log('🌐 Aplicação funcionará em:');
        console.log('   Frontend: http://localhost:3000');
        console.log('   API:      http://localhost:3001');
        console.log('');
        
        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('❌ ERRO na configuração do banco:');
        console.error(error.message);
        console.error('');
        console.error('Possíveis causas:');
        console.error('- Dependências não instaladas');
        console.error('- Erro de sintaxe nos arquivos');
        console.error('- Problema de permissão');
        console.error('');
        process.exit(1);
    }
}

configurarBanco(); 