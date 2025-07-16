import React, { useState, useEffect } from 'react';
import './App.css';

interface User {
  id: number;
  nome_completo: string;
  email: string;
  cpf: string;
  role: 'cliente' | 'admin' | 'funcionario';
  saldo: number;
}

interface Transaction {
  id: number;
  data_transacao: string;
  combustivel: string;
  valor: number;
  cashback: number;
  nome_completo?: string;
}

// Função para formatar CPF
const formatarCPF = (cpf: string) => {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Função para limpar CPF (apenas números)
const limparCPF = (cpf: string) => {
  return cpf.replace(/\D/g, '');
};

// Função para validar senha forte
const validarSenhaForte = (senha: string) => {
  if (senha.length < 6) return false;
  
  const temMaiuscula = /[A-Z]/.test(senha);
  const temMinuscula = /[a-z]/.test(senha);
  const temNumero = /\d/.test(senha);
  
  return temMaiuscula && temMinuscula && temNumero;
};

// Função para obter mensagem de erro da senha
const getMensagemSenha = (senha: string) => {
  if (senha.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
  if (!/[A-Z]/.test(senha)) return 'Senha deve ter pelo menos 1 letra maiúscula';
  if (!/[a-z]/.test(senha)) return 'Senha deve ter pelo menos 1 letra minúscula';
  if (!/\d/.test(senha)) return 'Senha deve ter pelo menos 1 número';
  return '';
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCadastro, setShowCadastro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [tipoLogin, setTipoLogin] = useState<'cliente' | 'funcionario' | null>(null);

  // Estados do formulário de login
  const [cpfLogin, setCpfLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  // Estados do formulário de cadastro
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCadastro, setCpfCadastro] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados do funcionário
  const [cpfCliente, setCpfCliente] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState<User | null>(null);
  const [combustivel, setCombustivel] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [paginaFuncionario, setPaginaFuncionario] = useState<'abastecimento' | 'validar-cashback'>('abastecimento');

  // Estados do sistema de cashback
  const [codigoCashback, setCodigoCashback] = useState('');
  const [valorCashback, setValorCashback] = useState(0);
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [codigoParaValidar, setCodigoParaValidar] = useState('');

  // Carregar transações quando usuário faz login
  useEffect(() => {
    if (currentUser) {
      carregarTransacoes();
    }
  }, [currentUser]);

  // Polling para atualizar saldo do cliente a cada 5 segundos
  useEffect(() => {
    if (currentUser && currentUser.role === 'cliente') {
      const interval = setInterval(async () => {
        try {
          const userResponse = await fetch(`http://localhost:3001/api/usuario/${currentUser.id}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.saldo !== currentUser.saldo) {
              setCurrentUser({ ...currentUser, saldo: userData.saldo });
              console.log(`🔄 Saldo atualizado automaticamente: R$ ${userData.saldo.toFixed(2)}`);
            }
          }
        } catch (error) {
          console.error('Erro no polling de atualização:', error);
        }
      }, 5000); // Atualiza a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const carregarTransacoes = async () => {
    if (!currentUser) return;

    try {
      const endpoint = currentUser.role === 'admin' 
        ? 'http://localhost:3001/api/admin/transacoes'
        : `http://localhost:3001/api/transacoes/${currentUser.id}`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  // Função para recarregar dados do usuário (saldo atualizado)
  const recarregarDadosUsuario = async () => {
    if (!currentUser) return;

    try {
      const userResponse = await fetch(`http://localhost:3001/api/usuario/${currentUser.id}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser({ ...currentUser, saldo: userData.saldo });
        console.log(`✅ Saldo atualizado: R$ ${userData.saldo.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Erro ao recarregar dados do usuário:', error);
    }
  };

  const handleLogin = async () => {
    if (!cpfLogin || !senhaLogin) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatórios',
        text: 'CPF e senha são obrigatórios',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: limparCPF(cpfLogin),
          senha: senhaLogin
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.usuario);
        setCpfLogin('');
        setSenhaLogin('');
        
        // Sucesso no login
        Swal.fire({
          icon: 'success',
          title: 'Login realizado!',
          text: `Bem-vindo(a), ${data.usuario.nome_completo}!`,
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: '#FF4757'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro no login',
          text: data.erro || 'Erro no login',
          confirmButtonColor: '#FF4757'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está rodando na porta 3001',
        confirmButtonColor: '#FF4757'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async () => {
    // Validações
    if (!nomeCompleto || !email || !cpfCadastro || !senhaCadastro || !confirmarSenha) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatórios',
        text: 'Todos os campos são obrigatórios',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (senhaCadastro !== confirmarSenha) {
      Swal.fire({
        icon: 'error',
        title: 'Senhas não coincidem',
        text: 'As senhas informadas não são iguais',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (!validarSenhaForte(senhaCadastro)) {
      Swal.fire({
        icon: 'warning',
        title: 'Senha fraca',
        text: getMensagemSenha(senhaCadastro),
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const response = await fetch('http://localhost:3001/api/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_completo: nomeCompleto,
          email: email,
          cpf: limparCPF(cpfCadastro),
          senha: senhaCadastro
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.usuario);
        // Limpa formulário
        setNomeCompleto('');
        setEmail('');
        setCpfCadastro('');
        setSenhaCadastro('');
        setConfirmarSenha('');
        setShowCadastro(false);
        
        // Sucesso no cadastro
        Swal.fire({
          icon: 'success',
          title: 'Cadastro realizado!',
          text: `Bem-vindo(a) ao Auto Posto Estrela D'Alva, ${data.usuario.nome_completo}!`,
          confirmButtonColor: '#FF4757'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro no cadastro',
          text: data.erro || 'Erro no cadastro',
          confirmButtonColor: '#FF4757'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está rodando na porta 3001',
        confirmButtonColor: '#FF4757'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCadastroFuncionario = async () => {
    // Validações
    if (!nomeCompleto || !email || !cpfCadastro || !senhaCadastro || !confirmarSenha) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatórios',
        text: 'Todos os campos são obrigatórios',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (senhaCadastro !== confirmarSenha) {
      Swal.fire({
        icon: 'error',
        title: 'Senhas não coincidem',
        text: 'As senhas informadas não são iguais',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (!validarSenhaForte(senhaCadastro)) {
      Swal.fire({
        icon: 'warning',
        title: 'Senha fraca',
        text: getMensagemSenha(senhaCadastro),
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const response = await fetch('http://localhost:3001/api/cadastro-funcionario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_completo: nomeCompleto,
          email: email,
          cpf: limparCPF(cpfCadastro),
          senha: senhaCadastro
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.usuario);
        // Limpa formulário
        setNomeCompleto('');
        setEmail('');
        setCpfCadastro('');
        setSenhaCadastro('');
        setConfirmarSenha('');
        setShowCadastro(false);
        
        // Sucesso no cadastro
        Swal.fire({
          icon: 'success',
          title: 'Funcionário cadastrado!',
          text: `Bem-vindo(a) à equipe, ${data.usuario.nome_completo}!`,
          confirmButtonColor: '#FF4757'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro no cadastro',
          text: data.erro || 'Erro no cadastro',
          confirmButtonColor: '#FF4757'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está rodando na porta 3001',
        confirmButtonColor: '#FF4757'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Sair do sistema?',
      text: 'Tem certeza que deseja fazer logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#FF4757',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, sair',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        setCurrentUser(null);
        setTransactions([]);
        setCpfLogin('');
        setSenhaLogin('');
        setErro('');
        setShowCadastro(false);
        
        Swal.fire({
          icon: 'success',
          title: 'Logout realizado!',
          text: 'Até a próxima!',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // Funções do funcionário
  const buscarCliente = async () => {
    if (!cpfCliente || !currentUser) {
      Swal.fire({
        icon: 'warning',
        title: 'CPF obrigatório',
        text: 'Digite o CPF do cliente',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/funcionario/buscar-cliente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf_cliente: limparCPF(cpfCliente),
          funcionario_id: currentUser.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setClienteEncontrado(data.cliente);
        Swal.fire({
          icon: 'success',
          title: 'Cliente encontrado!',
          text: `${data.cliente.nome_completo}`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Cliente não encontrado',
          text: data.erro,
          confirmButtonColor: '#FF4757'
        });
        setClienteEncontrado(null);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está rodando',
        confirmButtonColor: '#FF4757'
      });
      setClienteEncontrado(null);
    } finally {
      setLoading(false);
    }
  };

  const registrarAbastecimento = async () => {
    if (!clienteEncontrado || !combustivel || !valorTotal) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatórios',
        text: 'Preencha todos os campos do abastecimento',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    const valorNum = valorParaNumero(valorTotal);

    if (valorNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor inválido',
        text: 'O valor deve ser maior que zero',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/funcionario/registrar-abastecimento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf_cliente: limparCPF(cpfCliente),
          funcionario_id: currentUser!.id,
          combustivel: combustivel,
          litros: 0, // Campo removido da interface, enviando 0
          valor_total: valorNum,
          desconto_cashback: 0 // Sempre 0, pois desconto é feito na página dedicada
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Limpa formulário
        setCpfCliente('');
        setClienteEncontrado(null);
        setCombustivel('');
        setValorTotal('');

        Swal.fire({
          icon: 'success',
          title: 'Abastecimento registrado!',
          html: `
            <p><strong>Cliente:</strong> ${data.transacao.cliente}</p>
            <p><strong>Combustível:</strong> ${data.transacao.combustivel}</p>
            <p><strong>Valor:</strong> R$ ${data.transacao.valor.toFixed(2)}</p>
            <p><strong>Cashback ganho:</strong> +R$ ${data.transacao.cashback.toFixed(2)}</p>
            <p><strong>Novo saldo:</strong> R$ ${data.transacao.novo_saldo.toFixed(2)}</p>
          `,
          confirmButtonColor: '#FF4757'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro no abastecimento',
          text: data.erro,
          confirmButtonColor: '#FF4757'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está rodando',
        confirmButtonColor: '#FF4757'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCpfChange = (value: string, setCpfFunction: React.Dispatch<React.SetStateAction<string>>) => {
    const numeros = value.replace(/\D/g, '');
    if (numeros.length <= 11) {
      setCpfFunction(formatarCPF(numeros));
    }
  };

  // Função para formatar valor monetário
  const formatarMoeda = (valor: string): string => {
    // Remove tudo que não é dígito
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Se não há números, retorna vazio
    if (!apenasNumeros) return '';
    
    // Converte para número (centavos)
    const numero = parseInt(apenasNumeros, 10);
    
    // Formata como moeda brasileira
    return (numero / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Função para converter valor formatado em número
  const valorParaNumero = (valorFormatado: string): number => {
    if (!valorFormatado) return 0;
    const apenasNumeros = valorFormatado.replace(/\D/g, '');
    return parseFloat(apenasNumeros) / 100;
  };

  // Função para lidar com mudança do valor monetário
  const handleValorChange = (value: string) => {
    const valorFormatado = formatarMoeda(value);
    setValorTotal(valorFormatado);
  };

  // Função para gerar código de cashback único
  const gerarCodigoCashback = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';
    
    // Gera um padrão: 3 letras + 3 números + 2 letras (ex: ABC123XY)
    let codigo = '';
    
    // 3 letras iniciais
    for (let i = 0; i < 3; i++) {
      codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    
    // 3 números
    for (let i = 0; i < 3; i++) {
      codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));
    }
    
    // 2 letras finais
    for (let i = 0; i < 2; i++) {
      codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    
    // Adiciona timestamp para garantir unicidade
    const timestamp = Date.now().toString().slice(-2);
    codigo = codigo.slice(0, 6) + timestamp;
    
    return codigo;
  };

  // Função para utilizar cashback (cliente)
  const utilizarCashback = async (valor: number) => {
    if (valor < 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor mínimo',
        text: 'O valor mínimo para utilizar cashback é R$ 5,00',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (valor > currentUser!.saldo) {
      Swal.fire({
        icon: 'warning',
        title: 'Saldo insuficiente',
        text: 'Você não tem saldo suficiente para essa operação',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    setLoading(true);
    try {
      const codigo = gerarCodigoCashback();
      
      const response = await fetch('http://localhost:3001/api/gerar-codigo-cashback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: currentUser!.id,
          valor: valor,
          codigo: codigo
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCodigoCashback(codigo);
        setValorCashback(valor);
        setShowCashbackModal(true);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.erro,
          confirmButtonColor: '#FF4757'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está rodando',
        confirmButtonColor: '#FF4757'
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para solicitar valor de cashback
  const solicitarValorCashback = async () => {
    // Verifica se o saldo é suficiente
    if (currentUser!.saldo < 5) {
      Swal.fire({
        icon: 'warning',
        title: '<strong style="color: #FF4757;">💳 Saldo Insuficiente</strong>',
        html: `
          <div style="text-align: center; margin: 20px 0;">
            <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 12px; border: 1px solid #ffeaa7; margin-bottom: 20px;">
              <h3 style="margin: 0; font-size: 18px;">💰 Saldo Atual</h3>
              <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold;">R$ ${currentUser!.saldo.toFixed(2)}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #FF4757; margin-bottom: 20px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>⚠️ Valor mínimo necessário:</strong> R$ 5,00<br>
                <strong>📈 Você precisa de mais:</strong> R$ ${(5 - currentUser!.saldo).toFixed(2)}
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 0;">
              💡 <strong>Dica:</strong> Faça mais abastecimentos para acumular cashback e poder utilizar esta função!
            </p>
          </div>
        `,
        confirmButtonColor: '#FF4757',
        confirmButtonText: '✅ Entendi'
      });
      return;
    }

    const { value: valor } = await Swal.fire({
      title: '<strong style="color: #FF4757;">💰 Utilizar Cashback</strong>',
      html: `
        <div style="text-align: center; margin: 20px 0;">
          <div style="background: linear-gradient(135deg, #FF4757 0%, #FFC048 100%); color: white; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 18px;">💳 Saldo Disponível</h3>
            <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold;">R$ ${currentUser!.saldo.toFixed(2)}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #FFC048; margin-bottom: 20px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>🎯 Valor mínimo:</strong> R$ 5,00<br>
              <strong>📋 Máximo disponível:</strong> R$ ${currentUser!.saldo.toFixed(2)}
            </p>
          </div>
          
          <input 
            id="valor-cashback" 
            type="number" 
            min="5" 
            max="${currentUser!.saldo}" 
            step="0.01" 
            placeholder="Ex: 10.00"
            style="
              width: 100%; 
              padding: 12px; 
              border: 2px solid #e1e8ed; 
              border-radius: 8px; 
              font-size: 16px; 
              text-align: center;
              background: white;
              color: #333;
              box-sizing: border-box;
            "
          >
        </div>
      `,
      focusConfirm: false,
      confirmButtonColor: '#FF4757',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Gerar Código',
      cancelButtonText: '❌ Cancelar',
      showCancelButton: true,
      customClass: {
        popup: 'cashback-modal'
      },
      preConfirm: () => {
        const input = document.getElementById('valor-cashback') as HTMLInputElement;
        const valor = parseFloat(input.value);
        
        if (!input.value || input.value.trim() === '') {
          Swal.showValidationMessage('❌ Por favor, digite um valor');
          return false;
        }
        
        if (isNaN(valor) || valor <= 0) {
          Swal.showValidationMessage('❌ Digite um valor válido');
          return false;
        }
        
        if (valor < 5) {
          Swal.showValidationMessage('❌ O valor mínimo é R$ 5,00');
          return false;
        }
        
        if (valor > currentUser!.saldo) {
          Swal.showValidationMessage('❌ Valor não pode ser maior que o saldo disponível');
          return false;
        }
        
        // Validação de centavos
        if (valor.toString().split('.')[1] && valor.toString().split('.')[1].length > 2) {
          Swal.showValidationMessage('❌ Use no máximo 2 casas decimais');
          return false;
        }
        
        return valor;
      }
    });

    if (valor) {
      utilizarCashback(valor);
    }
  };



  // Função para validar código na nova página (aplicará desconto imediatamente)
  const validarCodigoCashbackNovaPagina = async () => {
    if (!codigoParaValidar) {
      Swal.fire({
        icon: 'warning',
        title: 'Código obrigatório',
        text: 'Digite o código de cashback do cliente',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/validar-codigo-cashback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: codigoParaValidar,
          funcionario_id: currentUser!.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Limpa o campo de código
        setCodigoParaValidar('');
        
        Swal.fire({
          icon: 'success',
          title: '✅ Código Validado com Sucesso!',
          html: `
            <div style="text-align: center; margin: 20px 0;">
              <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 20px;">💰 Cashback Aplicado</h3>
                <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold;">R$ ${data.valor.toFixed(2)}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                <p style="margin: 0; color: #333; font-size: 16px;">
                  <strong>👤 Cliente:</strong> ${data.cliente_nome}<br>
                  <strong>🎫 Código:</strong> ${codigoParaValidar}<br>
                  <strong>💸 Desconto aplicado:</strong> R$ ${data.valor.toFixed(2)}
                </p>
              </div>
              
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; color: #155724; font-size: 14px;">
                  ✅ <strong>O código foi validado e removido do sistema.</strong><br>
                  💰 <strong>O saldo do cliente foi atualizado automaticamente.</strong>
                </p>
              </div>
            </div>
          `,
          confirmButtonColor: '#28a745',
          confirmButtonText: '👍 Entendi'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Código Inválido',
          html: `
            <div style="text-align: center; margin: 20px 0;">
              <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px;">
                  <strong>❌ ${data.erro}</strong>
                </p>
              </div>
              
              <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>💡 Possíveis motivos:</strong><br>
                  • Código digitado incorretamente<br>
                  • Código já foi utilizado<br>
                  • Código expirado (30 minutos)<br>
                  • Cliente sem saldo suficiente
                </p>
              </div>
            </div>
          `,
          confirmButtonColor: '#FF4757'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está rodando',
        confirmButtonColor: '#FF4757'
      });
    } finally {
      setLoading(false);
    }
  };

  // Página de Login/Cadastro
  if (!currentUser) {
    // Tela de seleção do tipo de login
    if (!tipoLogin) {
      return (
        <div className="login-page">
          <div className="login-card">
            <img src="/logo.png" alt="Auto Posto Estrela D'Alva" className="logo-image" />
            <h1 className="logo">Auto Posto Estrela D'Alva</h1>
            <h2 className="subtitle">Selecione o tipo de acesso</h2>
            
            <div className="tipo-login-buttons">
              <button 
                onClick={() => setTipoLogin('cliente')}
                className="btn-tipo-login btn-cliente"
              >
                <div className="tipo-icon">👥</div>
                <div className="tipo-titulo">Cliente</div>
                <div className="tipo-descricao">Acessar conta e ver cashback</div>
              </button>
              
              <button 
                onClick={() => setTipoLogin('funcionario')}
                className="btn-tipo-login btn-funcionario"
              >
                <div className="tipo-icon">⛽</div>
                <div className="tipo-titulo">Funcionário</div>
                <div className="tipo-descricao">Registrar abastecimentos</div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="login-page">
        <div className={`login-card ${tipoLogin === 'funcionario' && showCadastro ? 'funcionario-container' : ''}`}>
          <img src="/logo.png" alt="Auto Posto Estrela D'Alva" className="logo-image" />
          <h1 className="logo">Auto Posto Estrela D'Alva</h1>
          
          <div className="back-button">
            <button 
              onClick={() => {
                setTipoLogin(null);
                setShowCadastro(false);
                setErro('');
              }}
              className="btn-back"
            >
              ← Voltar
            </button>
          </div>
          
          {erro && (
            <div className="erro-message">
              {erro}
            </div>
          )}

          {!showCadastro && tipoLogin === 'cliente' ? (
            // Formulário de Login - Cliente
            <>
              <h2 className="login-title">Login do Cliente</h2>
              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  value={cpfLogin}
                  onChange={(e) => handleCpfChange(e.target.value, setCpfLogin)}
                  className="form-input"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              
              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  className="form-input"
                  placeholder="••••••"
                />
              </div>
              
              <button 
                onClick={handleLogin} 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="cadastro-link">
                <p>Não tem conta? 
                  <button 
                    type="button"
                    onClick={() => setShowCadastro(true)}
                    className="link-button"
                  >
                    Cadastre-se aqui
                  </button>
                </p>
              </div>
              

            </>
          ) : tipoLogin === 'funcionario' && !showCadastro ? (
            // Formulário de Login - Funcionário
            <>
              <h2 className="login-title">Login do Funcionário</h2>
              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  value={cpfLogin}
                  onChange={(e) => handleCpfChange(e.target.value, setCpfLogin)}
                  className="form-input"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              
              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  className="form-input"
                  placeholder="••••••"
                />
              </div>
              
              <button 
                onClick={handleLogin} 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="cadastro-link">
                <p>Não tem conta? 
                  <button 
                    type="button"
                    onClick={() => setShowCadastro(true)}
                    className="link-button"
                  >
                    Cadastre-se aqui
                  </button>
                </p>
              </div>
            </>
          ) : showCadastro && tipoLogin === 'funcionario' ? (
            // Formulário de Cadastro - Funcionário
            <>
              <h2 className="cadastro-title">Cadastro de Funcionário</h2>
              
              <div className="form-group">
                <label>Nome Completo</label>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="form-input"
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  value={cpfCadastro}
                  onChange={(e) => handleCpfChange(e.target.value, setCpfCadastro)}
                  className="form-input"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  value={senhaCadastro}
                  onChange={(e) => setSenhaCadastro(e.target.value)}
                  className="form-input"
                  placeholder="Min 6: 1 maiúscula, 1 minúscula, 1 número"
                />
                {senhaCadastro && !validarSenhaForte(senhaCadastro) && (
                  <small className="senha-requisitos">
                    {getMensagemSenha(senhaCadastro)}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="form-input"
                  placeholder="Digite a senha novamente"
                />
              </div>
              
              <button 
                onClick={() => handleCadastroFuncionario()} 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Criar Conta de Funcionário'}
              </button>

              <div className="cadastro-link">
                <p>Já tem conta? 
                  <button 
                    type="button"
                    onClick={() => setShowCadastro(false)}
                    className="link-button"
                  >
                    Faça login aqui
                  </button>
                </p>
              </div>
            </>
          ) : showCadastro && tipoLogin === 'cliente' ? (
            // Formulário de Cadastro - Cliente
            <>
              <h2 className="cadastro-title">Criar Conta</h2>
              
              <div className="form-group">
                <label>Nome Completo</label>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="form-input"
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  value={cpfCadastro}
                  onChange={(e) => handleCpfChange(e.target.value, setCpfCadastro)}
                  className="form-input"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  value={senhaCadastro}
                  onChange={(e) => setSenhaCadastro(e.target.value)}
                  className="form-input"
                  placeholder="Min 6: 1 maiúscula, 1 minúscula, 1 número"
                />
                {senhaCadastro && !validarSenhaForte(senhaCadastro) && (
                  <small className="senha-requisitos">
                    {getMensagemSenha(senhaCadastro)}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="form-input"
                  placeholder="Digite a senha novamente"
                />
              </div>
              
              <button 
                onClick={handleCadastro} 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Criar Conta'}
              </button>

              <div className="cadastro-link">
                <p>Já tem conta? 
                  <button 
                    type="button"
                    onClick={() => setShowCadastro(false)}
                    className="link-button"
                  >
                    Faça login aqui
                  </button>
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // Dashboard do Funcionário
  if (currentUser.role === 'funcionario') {
    return (
      <div className="dashboard">
        <header className="header">
          <div className="header-logo">
            <img src="/logo.png" alt="Auto Posto Estrela D'Alva" className="header-logo-img" />
            <h1 className="header-title">Auto Posto Estrela D'Alva - Funcionário</h1>
          </div>
          <div className="user-info">
            <span>Funcionário: {currentUser.nome_completo}</span>
            <button onClick={handleLogout} className="btn-logout">
              Sair
            </button>
          </div>
        </header>

        <main className="main-content">
          <div className="funcionario-container">
            {/* Navegação entre páginas */}
            <div className="funcionario-nav">
              <button 
                onClick={() => setPaginaFuncionario('abastecimento')}
                className={`nav-btn ${paginaFuncionario === 'abastecimento' ? 'active' : ''}`}
              >
                <span className="nav-icon">⛽</span>
                <span className="nav-text">Registrar Abastecimento</span>
              </button>
              <button 
                onClick={() => setPaginaFuncionario('validar-cashback')}
                className={`nav-btn ${paginaFuncionario === 'validar-cashback' ? 'active' : ''}`}
              >
                <span className="nav-icon">🎫</span>
                <span className="nav-text">Validar Código Cashback</span>
              </button>
            </div>

            <div className="funcionario-card">
              {paginaFuncionario === 'abastecimento' ? (
                <>
                  <h2 className="section-title">Registrar Abastecimento</h2>
              
              {/* Buscar Cliente */}
              <div className="cliente-search">
                <h3>1. Buscar Cliente</h3>
                <div className="form-group">
                  <label>CPF do Cliente</label>
                  <input
                    type="text"
                    value={cpfCliente}
                    onChange={(e) => handleCpfChange(e.target.value, setCpfCliente)}
                    className="form-input"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <button 
                  onClick={buscarCliente}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Buscando...' : 'Buscar Cliente'}
                </button>
                
                {clienteEncontrado && (
                  <div className="cliente-info">
                    <h4>✅ Cliente Encontrado:</h4>
                    <p><strong>Nome:</strong> {clienteEncontrado.nome_completo}</p>
                    <p><strong>Email:</strong> {clienteEncontrado.email}</p>
                    <p><strong>Saldo Atual:</strong> R$ {clienteEncontrado.saldo.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Dados do Abastecimento */}
              <div className="abastecimento-form">
                <h3>2. Dados do Abastecimento</h3>
                
                <div className="form-group">
                  <label>Tipo de Combustível</label>
                  <select
                    value={combustivel}
                    onChange={(e) => setCombustivel(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Selecione o combustível</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Etanol">Etanol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="GNV">GNV</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Valor Total (R$)</label>
                  <input
                    type="text"
                    value={valorTotal}
                    onChange={(e) => handleValorChange(e.target.value)}
                    className="form-input"
                    placeholder="R$ 0,00"
                  />
                </div>
                
                <button 
                  onClick={registrarAbastecimento}
                  className="btn-primary btn-registrar"
                  disabled={loading || !clienteEncontrado}
                >
                  {loading ? 'Registrando...' : 'Registrar Abastecimento'}
                </button>
              </div>
                </>
              ) : (
                <>
                  <h2 className="section-title">Validar Código de Cashback</h2>
                  
                  <div className="validacao-cashback">
                    <div className="info-section">
                      <div className="info-card">
                        <h3>🎫 Como funciona?</h3>
                        <p>Digite o código de cashback que o cliente apresentou para validar e aplicar o desconto automaticamente.</p>
                      </div>
                    </div>

                    <div className="validacao-form">
                      <div className="form-group">
                        <label>Código de Cashback do Cliente</label>
                        <input
                          type="text"
                          value={codigoParaValidar}
                          onChange={(e) => setCodigoParaValidar(e.target.value.toUpperCase())}
                          className="form-input codigo-input"
                          placeholder="Ex: ABC12345"
                          maxLength={8}
                          style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            letterSpacing: '2px',
                            padding: '15px'
                          }}
                        />
                        <small className="input-help">
                          💡 Digite exatamente como o cliente mostrar (8 caracteres)
                        </small>
                      </div>

                      <button 
                        onClick={validarCodigoCashbackNovaPagina}
                        className="btn-primary btn-validar-codigo"
                        disabled={loading || !codigoParaValidar || codigoParaValidar.length < 8}
                      >
                        {loading ? 'Validando...' : '✅ Validar Código e Aplicar Desconto'}
                      </button>

                      <div className="instrucoes">
                        <h4>📋 Instruções:</h4>
                        <ul>
                          <li>✅ Peça para o cliente mostrar o código de cashback</li>
                          <li>⌨️ Digite o código exatamente como mostrado</li>
                          <li>🔍 Clique em "Validar Código" para processar</li>
                          <li>💰 O desconto será aplicado automaticamente ao saldo do cliente</li>
                          <li>🗑️ O código será removido após validação (não pode ser usado novamente)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard do Cliente
  if (currentUser.role === 'cliente') {
    return (
      <div className="dashboard">
        <header className="header">
          <div className="header-logo">
            <img src="/logo.png" alt="Auto Posto Estrela D'Alva" className="header-logo-img" />
            <h1 className="header-title">Auto Posto Estrela D'Alva</h1>
          </div>
          <div className="user-info">
            <span>Olá, {currentUser.nome_completo}</span>
            <button onClick={handleLogout} className="btn-logout">
              Sair
            </button>
          </div>
        </header>

        <main className="main-content">
          <div className="cards-grid">
            <div className="card green">
              <h2 className="card-title">Saldo Cashback</h2>
              <p className="card-value">R$ {currentUser.saldo.toFixed(2)}</p>
              <p className="card-subtitle">Disponível para resgate</p>
              <button 
                onClick={() => solicitarValorCashback()}
                className="btn-cashback"
                disabled={loading || currentUser.saldo < 5}
              >
                Utilizar Cashback
              </button>
            </div>
            
            <div className="card blue">
              <h2 className="card-title">Total de Transações</h2>
              <p className="card-value">{transactions.length}</p>
              <p className="card-subtitle">Compras realizadas</p>
            </div>
          </div>

          <div className="transactions">
            <h2 className="section-title">Histórico de Cashback</h2>
            {transactions.length > 0 ? (
              transactions.map(transaction => (
                <div key={transaction.id} className="transaction">
                  <div className="transaction-info">
                    <h4>{transaction.combustivel}</h4>
                    <p>{new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="transaction-values">
                    <p className="transaction-amount">Compra: R$ {transaction.valor.toFixed(2)}</p>
                    <p className="transaction-cashback">Cashback: +R$ {transaction.cashback.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-transactions">Nenhuma transação encontrada.</p>
            )}
          </div>
        </main>

        {/* Modal de código de cashback */}
        {showCashbackModal && (
          <div className="modal-overlay" onClick={() => setShowCashbackModal(false)}>
            <div className="modal-content cashback-code-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="success-icon">✅</div>
                <h2>Código de Cashback Gerado!</h2>
                <p>Mostre este código para o funcionário no posto</p>
              </div>
              
              <div className="codigo-cashback">
                <div className="codigo-container">
                  <div className="codigo-label">🎫 Código de Desconto</div>
                  <div className="codigo-display">
                    {codigoCashback}
                  </div>
                  <button 
                    className="copy-button"
                    onClick={() => {
                      navigator.clipboard.writeText(codigoCashback);
                      // Feedback visual
                      const button = document.querySelector('.copy-button');
                      if (button) {
                        button.textContent = '✅ Copiado!';
                        setTimeout(() => {
                          button.textContent = '📋 Copiar Código';
                        }, 2000);
                      }
                    }}
                  >
                    📋 Copiar Código
                  </button>
                </div>
                
                <div className="valor-info">
                  <div className="valor-item">
                    <span className="valor-label">💰 Valor do Desconto:</span>
                    <span className="valor-amount">R$ {valorCashback.toFixed(2)}</span>
                  </div>
                  <div className="expiracao-info">
                    <span className="expiracao-icon">⏰</span>
                    <span className="expiracao-text">Este código expira em 30 minutos</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={() => setShowCashbackModal(false)}
                  className="btn-fechar"
                >
                  ✅ Entendi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard do Admin
  return (
    <div className="dashboard">
              <header className="header">
          <div className="header-logo">
            <img src="/logo.png" alt="Auto Posto Estrela D'Alva" className="header-logo-img" />
            <h1 className="header-title">Auto Posto Estrela D'Alva - Admin</h1>
          </div>
        <div className="user-info">
          <span>Admin: {currentUser.nome_completo}</span>
          <button onClick={handleLogout} className="btn-logout">
            Sair
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="admin-cards">
          <div className="admin-card">
            <h3>Total Transações</h3>
            <p className="admin-value blue">{transactions.length}</p>
            <p className="admin-growth">Registradas no sistema</p>
          </div>
          
          <div className="admin-card">
            <h3>Cashback Distribuído</h3>
            <p className="admin-value green">
              R$ {transactions.reduce((total, t) => total + t.cashback, 0).toFixed(2)}
            </p>
            <p className="admin-growth">Total acumulado</p>
          </div>
          
          <div className="admin-card">
            <h3>Vendas Totais</h3>
            <p className="admin-value purple">
              R$ {transactions.reduce((total, t) => total + t.valor, 0).toFixed(2)}
            </p>
            <p className="admin-growth">Volume de vendas</p>
          </div>
        </div>

        <div className="transactions">
          <h2 className="section-title">Transações Recentes</h2>
          {transactions.length > 0 ? (
            transactions.map(transaction => (
              <div key={transaction.id} className="transaction">
                <div className="transaction-info">
                  <h4>{transaction.nome_completo || 'Cliente'} - {transaction.combustivel}</h4>
                  <p>{new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="transaction-values">
                  <p className="transaction-amount">R$ {transaction.valor.toFixed(2)}</p>
                  <p className="transaction-cashback">Cashback: R$ {transaction.cashback.toFixed(2)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-transactions">Nenhuma transação encontrada.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
