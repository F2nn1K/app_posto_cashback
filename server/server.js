const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { 
    initDatabase, 
    clearDatabase, 
    userQueries, 
    transactionQueries,
    validarCPF,
    validarEmail,
    run,
    query,
    get
} = require('./database');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware de segurança para limitar tentativas
const tentativasLogin = new Map();

function limitarTentativas(cpf) {
    const agora = Date.now();
    const tentativas = tentativasLogin.get(cpf) || { count: 0, ultimaTentativa: 0 };
    
    // Reset após 15 minutos
    if (agora - tentativas.ultimaTentativa > 15 * 60 * 1000) {
        tentativas.count = 0;
    }
    
    if (tentativas.count >= 5) {
        const tempoRestante = Math.ceil((15 * 60 * 1000 - (agora - tentativas.ultimaTentativa)) / 60000);
        throw new Error(`Muitas tentativas. Tente novamente em ${tempoRestante} minutos.`);
    }
    
    return tentativas;
}

// Função para sanitizar entrada
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().slice(0, 255); // Limita tamanho e remove espaços
}

// Função para validar dados de cadastro
function validarDadosCadastro(dados) {
    const erros = [];
    
    // Nome completo
    if (!dados.nome_completo || dados.nome_completo.length < 3) {
        erros.push('Nome completo deve ter pelo menos 3 caracteres');
    }
    if (dados.nome_completo && dados.nome_completo.length > 100) {
        erros.push('Nome completo muito longo (máximo 100 caracteres)');
    }
    
    // Email
    if (!dados.email || !validarEmail(dados.email)) {
        erros.push('Email inválido');
    }
    
    // CPF
    if (!dados.cpf || !validarCPF(dados.cpf)) {
        erros.push('CPF inválido');
    }
    
    // Senha forte
    if (!dados.senha || dados.senha.length < 6) {
        erros.push('Senha deve ter pelo menos 6 caracteres');
    }
    if (dados.senha && dados.senha.length > 50) {
        erros.push('Senha muito longa (máximo 50 caracteres)');
    }
    
    // Validação de senha forte
    if (dados.senha) {
        const temMaiuscula = /[A-Z]/.test(dados.senha);
        const temMinuscula = /[a-z]/.test(dados.senha);
        const temNumero = /\d/.test(dados.senha);
        
        if (!temMaiuscula) {
            erros.push('Senha deve ter pelo menos 1 letra maiúscula');
        }
        if (!temMinuscula) {
            erros.push('Senha deve ter pelo menos 1 letra minúscula');
        }
        if (!temNumero) {
            erros.push('Senha deve ter pelo menos 1 número');
        }
    }
    
    return erros;
}

// ROTAS DE AUTENTICAÇÃO

// Rota de cadastro
app.post('/api/cadastro', async (req, res) => {
    try {
        console.log('📝 Tentativa de cadastro recebida:', {
            nome_completo: req.body.nome_completo,
            email: req.body.email,
            cpf: req.body.cpf ? req.body.cpf.substring(0, 3) + '***' : 'vazio'
        });

        // Sanitiza dados de entrada
        const dados = {
            nome_completo: sanitizeInput(req.body.nome_completo),
            email: sanitizeInput(req.body.email).toLowerCase(),
            cpf: sanitizeInput(req.body.cpf).replace(/[^\d]/g, ''),
            senha: req.body.senha
        };

        console.log('🧹 Dados sanitizados:', {
            nome_completo: dados.nome_completo,
            email: dados.email,
            cpf: dados.cpf ? dados.cpf.substring(0, 3) + '***' : 'vazio'
        });
        
        // Valida dados
        const erros = validarDadosCadastro(dados);
        if (erros.length > 0) {
            return res.status(400).json({ erro: erros.join(', ') });
        }
        
        // Verifica se CPF já existe
        const usuarioExistenteCpf = await userQueries.findByCpf(dados.cpf);
        if (usuarioExistenteCpf) {
            return res.status(400).json({ erro: 'CPF já cadastrado' });
        }
        
        // Verifica se email já existe
        const usuarioExistenteEmail = await userQueries.findByEmail(dados.email);
        if (usuarioExistenteEmail) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        
        // Criptografa senha
        const senhaHash = await bcrypt.hash(dados.senha, 12);
        
        // Insere usuário
        const resultado = await userQueries.create(
            dados.nome_completo,
            dados.email,
            dados.cpf,
            senhaHash,
            'cliente'
        );
        
        // Busca usuário criado (sem senha)
        const novoUsuario = await userQueries.findById(resultado.lastID);
        delete novoUsuario.senha_hash;
        
        console.log(`✅ Novo usuário cadastrado: ${dados.nome_completo} (CPF: ${dados.cpf})`);
        
        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: novoUsuario
        });
        
    } catch (error) {
        console.error('Erro no cadastro:', error.message);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Rota de cadastro de funcionário
app.post('/api/cadastro-funcionario', async (req, res) => {
    try {
        console.log('👨‍💼 Tentativa de cadastro de funcionário recebida:', {
            nome_completo: req.body.nome_completo,
            email: req.body.email,
            cpf: req.body.cpf ? req.body.cpf.substring(0, 3) + '***' : 'vazio'
        });

        // Sanitiza dados de entrada
        const dados = {
            nome_completo: sanitizeInput(req.body.nome_completo),
            email: sanitizeInput(req.body.email).toLowerCase(),
            cpf: sanitizeInput(req.body.cpf).replace(/[^\d]/g, ''),
            senha: req.body.senha
        };

        console.log('🧹 Dados de funcionário sanitizados:', {
            nome_completo: dados.nome_completo,
            email: dados.email,
            cpf: dados.cpf ? dados.cpf.substring(0, 3) + '***' : 'vazio'
        });
        
        // Valida dados
        const erros = validarDadosCadastro(dados);
        if (erros.length > 0) {
            return res.status(400).json({ erro: erros.join(', ') });
        }
        
        // Verifica se CPF já existe
        const usuarioExistenteCpf = await userQueries.findByCpf(dados.cpf);
        if (usuarioExistenteCpf) {
            return res.status(400).json({ erro: 'CPF já cadastrado' });
        }
        
        // Verifica se email já existe
        const usuarioExistenteEmail = await userQueries.findByEmail(dados.email);
        if (usuarioExistenteEmail) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        
        // Criptografa senha
        const senhaHash = await bcrypt.hash(dados.senha, 12);
        
        // Insere funcionário
        const resultado = await userQueries.create(
            dados.nome_completo,
            dados.email,
            dados.cpf,
            senhaHash,
            'funcionario'
        );
        
        // Busca usuário criado (sem senha)
        const novoFuncionario = await userQueries.findById(resultado.lastID);
        delete novoFuncionario.senha_hash;
        
        console.log(`✅ Novo funcionário cadastrado: ${dados.nome_completo} (CPF: ${dados.cpf})`);
        
        res.status(201).json({
            mensagem: 'Funcionário cadastrado com sucesso!',
            usuario: novoFuncionario
        });
        
    } catch (error) {
        console.error('Erro no cadastro de funcionário:', error.message);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Rota de login
app.post('/api/login', async (req, res) => {
    try {
        const { cpf, senha } = req.body;
        
        // Sanitiza dados
        const cpfLimpo = sanitizeInput(cpf).replace(/[^\d]/g, '');
        
        // Valida dados básicos
        if (!cpfLimpo || !senha) {
            return res.status(400).json({ erro: 'CPF e senha são obrigatórios' });
        }
        
        if (!validarCPF(cpfLimpo)) {
            return res.status(400).json({ erro: 'CPF inválido' });
        }
        
        // Verifica tentativas de login
        const tentativas = limitarTentativas(cpfLimpo);
        
        // Busca usuário
        const usuario = await userQueries.findByCpf(cpfLimpo);
        
        if (!usuario) {
            tentativas.count++;
            tentativas.ultimaTentativa = Date.now();
            tentativasLogin.set(cpfLimpo, tentativas);
            return res.status(401).json({ erro: 'CPF ou senha incorretos' });
        }
        
        // Verifica senha
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
        
        if (!senhaCorreta) {
            tentativas.count++;
            tentativas.ultimaTentativa = Date.now();
            tentativasLogin.set(cpfLimpo, tentativas);
            return res.status(401).json({ erro: 'CPF ou senha incorretos' });
        }
        
        // Login bem-sucedido - limpa tentativas
        tentativasLogin.delete(cpfLimpo);
        
        // Remove senha do objeto retornado
        delete usuario.senha_hash;
        
        console.log(`✅ Login realizado: ${usuario.nome_completo} (${usuario.role})`);
        
        res.json({
            mensagem: 'Login realizado com sucesso!',
            usuario
        });
        
    } catch (error) {
        console.error('Erro no login:', error.message);
        
        if (error.message.includes('Muitas tentativas')) {
            return res.status(429).json({ erro: error.message });
        }
        
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ROTAS DE TRANSAÇÕES

// Buscar transações do usuário
app.get('/api/transacoes/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (!userId || userId <= 0) {
            return res.status(400).json({ erro: 'ID de usuário inválido' });
        }
        
        const transacoes = await transactionQueries.findByUser(userId);
        res.json(transacoes);
        
    } catch (error) {
        console.error('Erro ao buscar transações:', error.message);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Buscar todas as transações (admin)
app.get('/api/admin/transacoes', async (req, res) => {
    try {
        const transacoes = await transactionQueries.findAll();
        res.json(transacoes);
        
    } catch (error) {
        console.error('Erro ao buscar transações admin:', error.message);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Buscar estatísticas (admin)
app.get('/api/admin/estatisticas', async (req, res) => {
    try {
        const stats = await transactionQueries.getStats();
        res.json(stats);
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error.message);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ROTAS DE ADMINISTRAÇÃO

// Limpar banco de dados (admin)
app.post('/api/admin/limpar-banco', async (req, res) => {
    try {
        await clearDatabase();
        console.log('🗑️  Banco de dados limpo por administrador');
        res.json({ mensagem: 'Banco de dados limpo com sucesso!' });
        
    } catch (error) {
        console.error('Erro ao limpar banco:', error.message);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Rota de status/health check
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        servidor: 'Posto Verde Cashback API'
    });
});

// Rota para buscar usuário por ID (para atualizar saldo)
app.get('/api/usuario/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        if (!userId || userId <= 0) {
            return res.status(400).json({ erro: 'ID de usuário inválido' });
        }
        
        const usuario = await userQueries.findById(userId);
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Remove senha do retorno
        delete usuario.senha_hash;
        
        res.json(usuario);
        
    } catch (error) {
        console.error('Erro ao buscar usuário:', error.message);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Rota para atualizar saldo e pontos do usuário
app.put('/api/usuarios/:id/saldo', async (req, res) => {
    try {
        const { id } = req.params;
        const { saldo, pontos } = req.body;

        // Validar se o usuário existe
        const usuario = await userQueries.findById(id);
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        // Atualizar saldo se fornecido
        if (saldo !== undefined) {
            await userQueries.updateSaldo(id, saldo);
        }

        // Atualizar pontos se fornecido
        if (pontos !== undefined) {
            await run('UPDATE usuarios SET pontos = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?', [pontos, id]);
        }

        res.json({ 
            mensagem: 'Dados atualizados com sucesso',
            saldo: saldo || usuario.saldo,
            pontos: pontos || usuario.pontos || 0
        });

    } catch (error) {
        console.error('Erro ao atualizar dados do usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Rota para funcionário buscar cliente por CPF
app.post('/api/funcionario/buscar-cliente', async (req, res) => {
    try {
        const { cpf_cliente, funcionario_id } = req.body;
        
        // Sanitiza dados
        const cpfLimpo = sanitizeInput(cpf_cliente).replace(/[^\d]/g, '');
        
        if (!cpfLimpo || !funcionario_id) {
            return res.status(400).json({ erro: 'CPF do cliente e ID do funcionário são obrigatórios' });
        }
        
        if (!validarCPF(cpfLimpo)) {
            return res.status(400).json({ erro: 'CPF inválido' });
        }
        
        // Verifica se quem está fazendo a busca é funcionário
        const funcionario = await userQueries.findById(funcionario_id);
        if (!funcionario || funcionario.role !== 'funcionario') {
            return res.status(403).json({ erro: 'Acesso negado. Apenas funcionários podem buscar clientes' });
        }
        
        // Busca cliente
        const cliente = await userQueries.findByCpf(cpfLimpo);
        
        if (!cliente) {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }
        
        if (cliente.role !== 'cliente') {
            return res.status(400).json({ erro: 'CPF informado não é de um cliente' });
        }
        
        // Retorna dados do cliente (sem senha)
        delete cliente.senha_hash;
        
        res.json({
            mensagem: 'Cliente encontrado',
            cliente: cliente
        });
        
    } catch (error) {
        console.error('Erro ao buscar cliente:', error.message);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Rota para funcionário registrar abastecimento
app.post('/api/funcionario/registrar-abastecimento', async (req, res) => {
    try {
        const { cpf_cliente, funcionario_id, combustivel, forma_pagamento, litros, valor_total, desconto_cashback } = req.body;
        
        // Sanitiza dados
        const cpfLimpo = sanitizeInput(cpf_cliente).replace(/[^\d]/g, '');
        const combustivelLimpo = sanitizeInput(combustivel);
        const formaPagamentoLimpa = sanitizeInput(forma_pagamento);
        const litrosNum = parseFloat(litros) || 0;
        const valorNum = parseFloat(valor_total);
        const descontoNum = parseFloat(desconto_cashback) || 0;
        
        // Validações
        if (!cpfLimpo || !funcionario_id || !combustivelLimpo || !formaPagamentoLimpa || !valorNum) {
            return res.status(400).json({ erro: 'CPF, funcionário, combustível, forma de pagamento e valor são obrigatórios' });
        }
        
        if (!validarCPF(cpfLimpo)) {
            return res.status(400).json({ erro: 'CPF inválido' });
        }
        
        if (!['Gasolina Comum', 'Gasolina Aditivada', 'Diesel S-500', 'Diesel S-10'].includes(combustivelLimpo)) {
            return res.status(400).json({ erro: 'Tipo de combustível inválido' });
        }
        
        if (!['PIX/Dinheiro/Débito', 'Crédito'].includes(formaPagamentoLimpa)) {
            return res.status(400).json({ erro: 'Forma de pagamento inválida' });
        }
        
        if (valorNum <= 0) {
            return res.status(400).json({ erro: 'Valor deve ser maior que zero' });
        }
        
        // Verifica funcionário
        const funcionario = await userQueries.findById(funcionario_id);
        if (!funcionario || funcionario.role !== 'funcionario') {
            return res.status(403).json({ erro: 'Acesso negado. Apenas funcionários podem registrar abastecimentos' });
        }
        
        // Busca cliente
        const cliente = await userQueries.findByCpf(cpfLimpo);
        if (!cliente || cliente.role !== 'cliente') {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }
        
        // Calcula pontos: 2% do valor em pontos (R$ 1 = 2 pontos)
        const pontosGanhos = Math.floor(valorNum * 2);
        
        // Atualiza pontos do cliente
        const novosPontos = (cliente.pontos || 0) + pontosGanhos;
        
        // Registra transação (com pontos salvos na transação)
        const resultado = await transactionQueries.create({
            usuario_id: cliente.id,
            funcionario_id: funcionario.id,
            data_transacao: new Date().toISOString().split('T')[0],
            combustivel: combustivelLimpo,
            litros: litrosNum,
            valor: valorNum,
            cashback: 0, // Cashback zerado - agora só pontos
            pontos: pontosGanhos, // Salvar pontos na transação
            porcentagem_cashback: 0 // Porcentagem zerada
        });
        
        // Atualiza apenas os pontos do cliente (sem mexer no saldo)
        await run('UPDATE usuarios SET pontos = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?', [novosPontos, cliente.id]);
        
        console.log(`✅ Abastecimento registrado: ${cliente.nome_completo} - R$ ${valorNum.toFixed(2)} - Pontos ganhos: ${pontosGanhos} - Total pontos: ${novosPontos}`);
        
        res.status(201).json({
            mensagem: 'Abastecimento registrado com sucesso!',
            transacao: {
                id: resultado.lastID,
                cliente: cliente.nome_completo,
                combustivel: combustivelLimpo,
                litros: litrosNum,
                valor: valorNum,
                pontos_ganhos: pontosGanhos,
                total_pontos: novosPontos
            }
        });
        
    } catch (error) {
        console.error('Erro ao registrar abastecimento:', error.message);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Rota para gerar código de cashback
app.post('/api/gerar-codigo-cashback', async (req, res) => {
    try {
        const { usuario_id, valor, codigo } = req.body;
        
        // Sanitiza dados
        const usuarioId = parseInt(sanitizeInput(usuario_id));
        const valorNum = parseFloat(sanitizeInput(valor));
        const codigoLimpo = sanitizeInput(codigo);
        
        if (!usuarioId || !valorNum || !codigoLimpo) {
            return res.status(400).json({ erro: 'Dados obrigatórios: usuario_id, valor, codigo' });
        }
        
        if (valorNum < 5) {
            return res.status(400).json({ erro: 'Valor mínimo para cashback é R$ 5,00' });
        }
        
        // Verifica se usuário existe e tem saldo suficiente
        const usuario = await userQueries.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        if (usuario.saldo < valorNum) {
            return res.status(400).json({ erro: 'Saldo insuficiente' });
        }
        
                // Cria código na tabela de códigos
        await run(`
            INSERT INTO codigos_cashback (usuario_id, codigo, valor, data_criacao, data_expiracao, usado) 
            VALUES (?, ?, ?, datetime('now'), datetime('now', '+30 minutes'), 0)
        `, [usuarioId, codigoLimpo, valorNum]);
        
        // IMPORTANTE: NÃO desconta o saldo aqui, pois será descontado quando o código for validado
        console.log(`📋 Código cashback criado: ${codigoLimpo} - Cliente: ${usuario.nome_completo} - Valor: R$ ${valorNum.toFixed(2)}`);
        
        res.json({ 
            mensagem: 'Código gerado com sucesso!',
            codigo: codigoLimpo,
            valor: valorNum,
            expira_em: '30 minutos'
        });
        
    } catch (error) {
        console.error('Erro ao gerar código:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Rota para validar código de cashback
app.post('/api/validar-codigo-cashback', async (req, res) => {
    try {
        const { codigo, funcionario_id } = req.body;
        
        // Sanitiza dados
        const codigoLimpo = sanitizeInput(codigo);
        const funcionarioId = parseInt(sanitizeInput(funcionario_id));
        
        if (!codigoLimpo || !funcionarioId) {
            return res.status(400).json({ erro: 'Código e ID do funcionário são obrigatórios' });
        }
        
        // Verifica se quem está validando é funcionário
        const funcionario = await userQueries.findById(funcionarioId);
        if (!funcionario || funcionario.role !== 'funcionario') {
            return res.status(403).json({ erro: 'Acesso negado. Apenas funcionários podem validar códigos' });
        }
        
        // Busca código válido
        const codigoDB = await get(`
            SELECT cc.*, u.nome_completo as cliente_nome, u.saldo
            FROM codigos_cashback cc
            JOIN usuarios u ON cc.usuario_id = u.id
            WHERE cc.codigo = ? 
            AND cc.usado = 0 
            AND cc.data_expiracao > datetime('now')
        `, [codigoLimpo]);
        
        if (!codigoDB) {
            return res.status(404).json({ erro: 'Código inválido, expirado ou já utilizado' });
        }
        
        // Verifica se cliente ainda tem saldo suficiente
        if (codigoDB.saldo < codigoDB.valor) {
            return res.status(400).json({ erro: 'Cliente não tem saldo suficiente' });
        }
        
        // Calcula novo saldo (diminui o valor do cashback)
        const novoSaldo = codigoDB.saldo - codigoDB.valor;
        
        // Atualiza saldo do cliente
        await userQueries.updateSaldo(codigoDB.usuario_id, novoSaldo);
        
        // Marca código como usado
        await run(`
            UPDATE codigos_cashback 
            SET usado = 1, data_uso = datetime('now'), funcionario_id = ?
            WHERE id = ?
        `, [funcionarioId, codigoDB.id]);
        
        console.log(`✅ Código cashback validado: ${codigoLimpo} - Cliente: ${codigoDB.cliente_nome} - Valor: R$ ${codigoDB.valor.toFixed(2)} - Novo saldo: R$ ${novoSaldo.toFixed(2)}`);
        
        res.json({
            mensagem: 'Código validado com sucesso!',
            cliente_nome: codigoDB.cliente_nome,
            valor: codigoDB.valor,
            codigo_id: codigoDB.id,
            novo_saldo: novoSaldo
        });
        
    } catch (error) {
        console.error('Erro ao validar código:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Inicialização do servidor
async function iniciarServidor() {
    try {
        // Inicializa banco de dados
        await initDatabase();
        
        // Inicia servidor
        app.listen(PORT, () => {
            console.log('========================================');
            console.log('      🚗 POSTO VERDE CASHBACK API 🚗');
            console.log('========================================');
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`🌐 API disponível em: http://localhost:${PORT}`);
            console.log('✅ Banco de dados SQLite inicializado');
            console.log('🔒 Segurança ativada contra SQL injection');
            console.log('🔐 Sistema de login com hash bcrypt');
            console.log('========================================');
        });
    } catch (error) {
        console.error('Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// Inicia o servidor
iniciarServidor();

module.exports = app; 