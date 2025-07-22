const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Cria/conecta ao banco SQLite
const dbPath = path.join(__dirname, 'posto_cashback.db');
const db = new sqlite3.Database(dbPath);

// Função para promisificar queries
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Função para inicializar o banco
async function initDatabase() {
    console.log('🗄️  Inicializando banco de dados...');

    try {
        // Tabela de usuários
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_completo TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                cpf TEXT UNIQUE NOT NULL,
                senha_hash TEXT NOT NULL,
                role TEXT DEFAULT 'cliente' CHECK(role IN ('cliente', 'admin', 'funcionario')),
                saldo DECIMAL(10,2) DEFAULT 0.00,
                pontos INTEGER DEFAULT 0,
                ativo BOOLEAN DEFAULT 1,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Tabela de transações
        const createTransactionsTable = `
            CREATE TABLE IF NOT EXISTS transacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                funcionario_id INTEGER,
                data_transacao DATE NOT NULL,
                combustivel TEXT NOT NULL CHECK(combustivel IN ('Gasolina Comum', 'Gasolina Aditivada', 'Diesel S-500', 'Diesel S-10')),
                litros DECIMAL(10,3) DEFAULT 0,
                valor DECIMAL(10,2) NOT NULL CHECK(valor > 0),
                cashback DECIMAL(10,2) NOT NULL CHECK(cashback >= 0),
                pontos INTEGER DEFAULT 0,
                porcentagem_cashback DECIMAL(5,2) DEFAULT 5.00,
                status TEXT DEFAULT 'processado' CHECK(status IN ('pendente', 'processado', 'cancelado')),
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
                FOREIGN KEY (funcionario_id) REFERENCES usuarios (id)
            )
        `;

        // Tabela de configurações do sistema
        const createConfigTable = `
            CREATE TABLE IF NOT EXISTS configuracoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chave TEXT UNIQUE NOT NULL,
                valor TEXT NOT NULL,
                descricao TEXT,
                data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Tabela de códigos de cashback
        const createCashbackCodesTable = `
            CREATE TABLE IF NOT EXISTS codigos_cashback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                codigo TEXT UNIQUE NOT NULL,
                valor REAL NOT NULL,
                usado INTEGER DEFAULT 0,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_expiracao DATETIME NOT NULL,
                data_uso DATETIME,
                funcionario_id INTEGER,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
                FOREIGN KEY (funcionario_id) REFERENCES usuarios (id)
            )
        `;

        // Executa as queries
        await run(createUsersTable);
        await run(createTransactionsTable);
        await run(createConfigTable);

        // Adicionar coluna pontos se não existir (para bancos já criados)
        try {
            await run('ALTER TABLE usuarios ADD COLUMN pontos INTEGER DEFAULT 0');
            console.log('✅ Coluna pontos adicionada à tabela usuarios');
        } catch (error) {
            // Coluna já existe, não há problema
            if (!error.message.includes('duplicate column name')) {
                console.log('ℹ️  Coluna pontos já existe na tabela usuarios');
            }
        }

        // Adicionar coluna pontos na tabela transacoes se não existir
        try {
            await run('ALTER TABLE transacoes ADD COLUMN pontos INTEGER DEFAULT 0');
            console.log('✅ Coluna pontos adicionada à tabela transacoes');
        } catch (error) {
            // Coluna já existe, não há problema
            if (!error.message.includes('duplicate column name')) {
                console.log('ℹ️  Coluna pontos já existe na tabela transacoes');
            }
        }
        await run(createCashbackCodesTable);

        console.log('✅ Tabelas criadas com sucesso!');

        // Insere configurações padrão
        await insertDefaultConfigs();

        // Insere usuário admin padrão se não existir
        await insertDefaultAdmin();

        console.log('✅ Banco de dados inicializado!');
    } catch (error) {
        console.error('Erro ao inicializar banco:', error);
        throw error;
    }
}

// Função para inserir configurações padrão
async function insertDefaultConfigs() {
    const configs = [
        ['cashback_gasolina', '10.00', 'Porcentagem de cashback para gasolina'],
        ['cashback_etanol', '12.00', 'Porcentagem de cashback para etanol'],
        ['cashback_diesel', '8.00', 'Porcentagem de cashback para diesel'],
        ['cashback_gnv', '15.00', 'Porcentagem de cashback para GNV'],
        ['valor_minimo_compra', '20.00', 'Valor mínimo para gerar cashback']
    ];

    for (const [chave, valor, descricao] of configs) {
        try {
            await run(
                'INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES (?, ?, ?)',
                [chave, valor, descricao]
            );
        } catch (error) {
            console.error(`Erro ao inserir configuração ${chave}:`, error);
        }
    }
}

// Função para inserir usuários padrão
async function insertDefaultAdmin() {
    try {
        // Verifica e cria admin
        const adminExists = await get('SELECT COUNT(*) as count FROM usuarios WHERE role = ?', ['admin']);
        if (adminExists.count === 0) {
            const senhaHash = await bcrypt.hash('Admin123', 10);
            await run(
                'INSERT INTO usuarios (nome_completo, email, cpf, senha_hash, role) VALUES (?, ?, ?, ?, ?)',
                ['Administrador Sistema', 'admin@posto.com', '00000000000', senhaHash, 'admin']
            );
            console.log('✅ Usuário admin criado: CPF: 000.000.000-00 | Senha: Admin123');
        }

        // Verifica e cria funcionário de teste específico
        const funcionarioTesteExists = await get('SELECT COUNT(*) as count FROM usuarios WHERE cpf = ? AND role = ?', ['12345678901', 'funcionario']);
        if (funcionarioTesteExists.count === 0) {
            const senhaHash = await bcrypt.hash('Admin123456', 10);
            await run(
                'INSERT INTO usuarios (nome_completo, email, cpf, senha_hash, role) VALUES (?, ?, ?, ?, ?)',
                ['Funcionário Posto', 'funcionario@estrela.com', '12345678901', senhaHash, 'funcionario']
            );
            console.log('✅ Usuário funcionário teste criado: CPF: 123.456.789-01 | Senha: Admin123456');
        }
    } catch (error) {
        console.error('Erro ao criar usuários padrão:', error);
    }
}

// Função para limpar todos os dados (mas mantém estrutura)
async function clearDatabase() {
    console.log('🗑️  Limpando dados do banco...');
    
    try {
        // Verifica e limpa tabelas se existirem
        try { await run('DELETE FROM transacoes'); } catch (e) { /* tabela não existe */ }
        try { await run('DELETE FROM usuarios'); } catch (e) { /* tabela não existe */ }
        try { await run('DELETE FROM configuracoes'); } catch (e) { /* tabela não existe */ }
        
        // Reseta os auto-increment
        try { 
            await run('DELETE FROM sqlite_sequence WHERE name IN ("usuarios", "transacoes", "configuracoes")'); 
        } catch (e) { /* sequência não existe */ }
        
        console.log('✅ Banco limpo! Reinserindo dados padrão...');
        
        // Reinsere dados padrão
        await insertDefaultConfigs();
        await insertDefaultAdmin();
    } catch (error) {
        console.error('Erro ao limpar banco:', error);
        throw error;
    }
}

// Funções de usuário
const userQueries = {
    // Buscar usuário por CPF
    async findByCpf(cpf) {
        return await get('SELECT * FROM usuarios WHERE cpf = ? AND ativo = 1', [cpf]);
    },
    
    // Buscar usuário por email
    async findByEmail(email) {
        return await get('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email]);
    },
    
    // Buscar usuário por ID
    async findById(id) {
        return await get('SELECT * FROM usuarios WHERE id = ? AND ativo = 1', [id]);
    },
    
    // Criar novo usuário
    async create(nome_completo, email, cpf, senha_hash, role = 'cliente') {
        return await run(
            'INSERT INTO usuarios (nome_completo, email, cpf, senha_hash, role) VALUES (?, ?, ?, ?, ?)',
            [nome_completo, email, cpf, senha_hash, role]
        );
    },
    
    // Atualizar saldo
    async updateSaldo(id, saldo) {
        return await run('UPDATE usuarios SET saldo = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?', [saldo, id]);
    },
    
    // Listar todos os usuários
    async listAll() {
        return await query('SELECT id, nome_completo, email, cpf, role, saldo, data_criacao FROM usuarios WHERE ativo = 1');
    }
};

// Funções de transação
const transactionQueries = {
    // Criar nova transação
    async create(dados) {
        const {
            usuario_id,
            funcionario_id = null,
            data_transacao,
            combustivel,
            litros = 0,
            valor,
            cashback,
            pontos = 0,
            porcentagem_cashback = 5.00
        } = dados;
        
        return await run(
            'INSERT INTO transacoes (usuario_id, funcionario_id, data_transacao, combustivel, litros, valor, cashback, pontos, porcentagem_cashback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [usuario_id, funcionario_id, data_transacao, combustivel, litros, valor, cashback, pontos, porcentagem_cashback]
        );
    },
    
    // Buscar transações por usuário
    async findByUser(usuario_id) {
        return await query(
            'SELECT * FROM transacoes WHERE usuario_id = ? ORDER BY data_transacao DESC, data_criacao DESC',
            [usuario_id]
        );
    },
    
    // Buscar todas as transações (para admin)
    async findAll() {
        return await query(`
            SELECT t.*, u.nome_completo 
            FROM transacoes t 
            JOIN usuarios u ON t.usuario_id = u.id 
            ORDER BY t.data_transacao DESC, t.data_criacao DESC
        `);
    },
    
    // Estatísticas
    async getStats() {
        return await get(`
            SELECT 
                COUNT(*) as total_transacoes,
                COALESCE(SUM(valor), 0) as total_vendas,
                COALESCE(SUM(cashback), 0) as total_cashback,
                COUNT(DISTINCT usuario_id) as clientes_ativos
            FROM transacoes 
            WHERE data_transacao >= date('now', '-30 days')
        `);
    }
};

// Função para validar CPF (simples)
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // CPFs com todos os dígitos iguais
    
    return true;
}

// Função para validar email
function validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

module.exports = {
    db,
    query,
    run,
    get,
    initDatabase,
    clearDatabase,
    userQueries,
    transactionQueries,
    validarCPF,
    validarEmail
}; 