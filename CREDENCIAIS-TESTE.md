# 🔑 Credenciais de Teste - Auto Posto Estrela D'Alva

## 👤 **Tipos de Usuário**

### 🔧 **ADMIN** 
- **CPF**: `000.000.000-00`
- **Senha**: `Admin123`
- **Acesso**: Dashboard administrativo completo
- **Funcionalidades**: Ver todos os usuários, estatísticas, transações

### ⛽ **FUNCIONÁRIO**
- **CPF**: `123.456.789-01` 
- **Senha**: `Admin123456`
- **Acesso**: Sistema de registrar abastecimentos
- **Funcionalidades**: Buscar clientes, registrar abastecimentos, gerar cashback

### 👥 **CLIENTE**
- **Cadastro**: Criar conta nova através da tela de cliente
- **Acesso**: Dashboard pessoal com saldo e histórico
- **Funcionalidades**: Ver cashback, histórico de transações

## 🚀 **Como Testar**

### 1. **Login como Funcionário**
1. Abra a aplicação
2. Selecione "Funcionário" 
3. Digite CPF: `123.456.789-01`
4. Digite Senha: `Admin123456`
5. Clique em "Entrar"

### 2. **Registrar Abastecimento**
1. No campo "CPF do Cliente", digite o CPF de um cliente existente
2. Clique em "Buscar Cliente"
3. Preencha os dados:
   - **Combustível**: Selecione (Gasolina, Etanol, Diesel, GNV)
   - **Valor Total**: Digite apenas números (ex: 15236 = R$ 152,36)
4. Clique em "Registrar Abastecimento"
5. **Cashback de 5%** será creditado automaticamente!

### 💰 **Formatação de Moeda**
- Digite apenas números: `15236` 
- Sistema formata automaticamente: `R$ 152,36`
- Para R$ 25,00: digite `2500`
- Para R$ 100,50: digite `10050`

### 🎫 **Sistema de Cashback**

#### **Cliente - Gerar Código:**
1. Faça login como cliente
2. Se tiver saldo ≥ R$ 5,00, aparecerá botão "Utilizar Cashback"
3. Clique no botão e digite o valor desejado (mín. R$ 5,00)
4. Sistema gera código alfanumérico (ex: `AB12CD34`)
5. Mostre este código para o funcionário

#### **Funcionário - Validar Código:**
1. Na tela de abastecimento, há campo "Código de Cashback"
2. Digite o código fornecido pelo cliente
3. Clique em "Validar"
4. Se válido, desconto é aplicado automaticamente
5. Continue com o abastecimento normalmente

#### **Como Funciona:**
- Códigos expiram em **30 minutos**
- Valor mínimo: **R$ 5,00**
- Desconto é aplicado no valor total do abastecimento
- Cliente ganha cashback normal (5%) + usa o desconto
- Saldo do cliente é atualizado automaticamente

### 3. **Verificar Cashback**
1. Faça logout do funcionário
2. Faça login como cliente (com o CPF usado no abastecimento)
3. Veja o saldo atualizado no dashboard

## 💰 **Sistema de Cashback**

- **Taxa**: 5% do valor do abastecimento
- **Crédito**: Automático e imediato
- **Exemplo**: Abastecimento R$ 100,00 → Cashback R$ 5,00

## 🔄 **Fluxo Completo de Teste**

1. **Cadastre um cliente** (ou use existente)
2. **Login como funcionário** (CPF: 123.456.789-01)
3. **Registre abastecimento** para o cliente
4. **Logout e login como cliente** 
5. **Veja o cashback** creditado na conta

## 📋 **Dados de Exemplo para Teste**

### Abastecimento Exemplo:
- **Combustível**: Gasolina
- **Litros**: 45.500
- **Valor**: R$ 300.00
- **Cashback**: R$ 15.00 (5%)

### Cliente Teste (se precisar):
- **Nome**: João Silva
- **Email**: joao@email.com
- **CPF**: Qualquer CPF válido
- **Senha**: Abc123 (ou conforme validação)

## ⚙️ **Configuração**

O banco foi atualizado automaticamente com:
- ✅ Suporte a funcionários
- ✅ Novos campos de transação (litros, funcionário)
- ✅ Usuário funcionário criado
- ✅ Constraint atualizada

## 🎯 **Objetivos do Teste**

- [x] Login diferenciado (cliente vs funcionário)
- [x] Busca de cliente por CPF
- [x] Registro de abastecimento
- [x] Cálculo automático de cashback (5%)
- [x] Atualização de saldo em tempo real
- [x] Interface responsiva
- [x] Validações de segurança 