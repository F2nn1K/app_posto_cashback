import React, { useState, useEffect } from 'react';
import './App.css';

// Declaração global do SweetAlert2 (carregado via CDN)
declare const Swal: any;

interface User {
  id: number;
  nome_completo: string;
  email: string;
  cpf: string;
  role: 'cliente' | 'admin' | 'funcionario';
  saldo: number;
  pontos?: number; // Adicionado para o novo box de pontos
}

interface Transaction {
  id: number;
  data_transacao: string;
  combustivel: string;
  valor: number;
  cashback: number;
  pontos?: number; // Pontos ganhos na transação
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
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [paginaFuncionario, setPaginaFuncionario] = useState<'abastecimento' | 'validar-cashback'>('abastecimento');

  // Estados para validar cashback
  const [cpfValidacao, setCpfValidacao] = useState('');
  const [clienteValidacao, setClienteValidacao] = useState<User | null>(null);
  const [valorCashback, setValorCashback] = useState('');
  const [codigoValidacao, setCodigoValidacao] = useState('');

  // Estados do modal de conversão de pontos
  const [showConversaoModal, setShowConversaoModal] = useState(false);
  const [pontosParaConverter, setPontosParaConverter] = useState('');

  // Estados do modal de extrato de pontos
  const [showExtratoModal, setShowExtratoModal] = useState(false);

  // Estados do modal de utilizar cashback
  const [showUtilizarCashbackModal, setShowUtilizarCashbackModal] = useState(false);
  const [valorUtilizarCashback, setValorUtilizarCashback] = useState('');
  const [codigoGerado, setCodigoGerado] = useState<string | null>(null);

  // Estados do carrossel de promoções
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;





  // Carregar transações quando usuário faz login
  useEffect(() => {
    if (currentUser) {
      carregarTransacoes();
    }
  }, [currentUser]);

  // Polling para atualizar dados do cliente a cada 5 segundos
  useEffect(() => {
    if (currentUser && currentUser.role === 'cliente') {
      const interval = setInterval(async () => {
        try {
          const userResponse = await fetch(`http://localhost:3001/api/usuario/${currentUser.id}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            // Atualizar tanto saldo quanto pontos
            if (userData.saldo !== currentUser.saldo || userData.pontos !== currentUser.pontos) {
              setCurrentUser({ 
                ...currentUser, 
                saldo: userData.saldo,
                pontos: userData.pontos || 0
              });
              console.log(`🔄 Dados atualizados automaticamente: R$ ${userData.saldo.toFixed(2)} - ${userData.pontos || 0} pontos`);
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

  // Função para recarregar dados do usuário (saldo e pontos atualizados)
  const recarregarDadosUsuario = async () => {
    if (!currentUser) return;

    try {
      const userResponse = await fetch(`http://localhost:3001/api/usuario/${currentUser.id}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser({ 
          ...currentUser, 
          saldo: userData.saldo,
          pontos: userData.pontos || 0
        });
        console.log(`✅ Dados atualizados: R$ ${userData.saldo.toFixed(2)} - ${userData.pontos || 0} pontos`);
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
        // Validação do tipo de usuário conforme tela de login
        const usuarioLogado = data.usuario;
        
        // Admin pode acessar qualquer tela, mas vamos direcioná-lo corretamente
        if (usuarioLogado.role === 'admin') {
          // Admin sempre pode entrar, mas vamos avisá-lo se estiver na tela errada
          if (tipoLogin === 'funcionario') {
            Swal.fire({
              icon: 'info',
              title: 'Login de Admin',
              text: 'Você é um administrador. Redirecionando para o dashboard admin.',
              confirmButtonColor: '#FF4757'
            });
          }
        } else {
          // Validação rigorosa para clientes e funcionários
          if (tipoLogin === 'cliente' && usuarioLogado.role !== 'cliente') {
            Swal.fire({
              icon: 'error',
              title: 'Acesso negado',
              text: 'Este CPF não é de um cliente. Use o login de funcionário.',
              confirmButtonColor: '#FF4757'
            });
            return;
          }
          
          if (tipoLogin === 'funcionario' && usuarioLogado.role !== 'funcionario') {
            Swal.fire({
              icon: 'error',
              title: 'Acesso negado',
              text: 'Este CPF não é de um funcionário. Use o login de cliente.',
              confirmButtonColor: '#FF4757'
            });
            return;
          }
        }
        
        setCurrentUser(usuarioLogado);
        setCpfLogin('');
        setSenhaLogin('');
        
        // Sucesso no login
        Swal.fire({
          icon: 'success',
          title: 'Login realizado!',
          text: `Bem-vindo(a), ${usuarioLogado.nome_completo}!`,
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
    if (!clienteEncontrado || !combustivel || !formaPagamento || !valorTotal) {
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
          forma_pagamento: formaPagamento,
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
        setFormaPagamento('');
        setValorTotal('');

        Swal.fire({
          icon: 'success',
          title: 'Abastecimento registrado!',
          html: `
            <p><strong>Cliente:</strong> ${data.transacao.cliente}</p>
            <p><strong>Combustível:</strong> ${data.transacao.combustivel}</p>
            <p><strong>Pagamento:</strong> ${formaPagamento}</p>
            <p><strong>Valor:</strong> R$ ${data.transacao.valor.toFixed(2)}</p>
            <p><strong>Pontos ganhos:</strong> ⭐ ${data.transacao.pontos_ganhos} pontos</p>
            <p><strong>Total de pontos:</strong> ${data.transacao.total_pontos} pontos</p>
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

  // Função para buscar cliente na validação
  const buscarClienteValidacao = async () => {
    if (!cpfValidacao || !currentUser) {
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
          cpf_cliente: limparCPF(cpfValidacao),
          funcionario_id: currentUser.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setClienteValidacao(data.cliente);
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
        setClienteValidacao(null);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está rodando',
        confirmButtonColor: '#FF4757'
      });
      setClienteValidacao(null);
    } finally {
      setLoading(false);
    }
  };

  // Função para validar código de cashback
  const validarCodigoCashback = async () => {
    if (!codigoValidacao.trim()) {
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
          codigo: codigoValidacao.toUpperCase(),
          funcionario_id: currentUser!.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Limpa formulário
        setCodigoValidacao('');

        Swal.fire({
          icon: 'success',
          title: 'Código validado com sucesso!',
          html: `
            <p><strong>Cliente:</strong> ${data.cliente_nome}</p>
            <p><strong>Valor validado:</strong> R$ ${data.valor.toFixed(2)}</p>
            <p><strong>Novo saldo do cliente:</strong> R$ ${data.novo_saldo.toFixed(2)}</p>
            <hr>
            <p><small>💡 O desconto já foi aplicado automaticamente</small></p>
          `,
          confirmButtonColor: '#FF4757'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro na validação',
          text: data.erro || 'Código inválido ou expirado',
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

  // Função para validar cashback (método antigo - manter para compatibilidade)
  const validarCashback = async () => {
    if (!clienteValidacao) {
      Swal.fire({
        icon: 'warning',
        title: 'Cliente obrigatório',
        text: 'Primeiro busque o cliente',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (!valorCashback.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor obrigatório',
        text: 'Digite o valor do cashback',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    const valorNum = valorParaNumero(valorCashback);

    if (valorNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor inválido',
        text: 'O valor deve ser maior que zero',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (valorNum > clienteValidacao.saldo) {
      Swal.fire({
        icon: 'warning',
        title: 'Saldo insuficiente',
        text: 'Valor maior que o saldo disponível do cliente',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/usuarios/${clienteValidacao.id}/saldo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saldo: clienteValidacao.saldo - valorNum,
          pontos: clienteValidacao.pontos || 0
        }),
      });

      if (response.ok) {
        // Limpa formulário
        setCpfValidacao('');
        setClienteValidacao(null);
        setValorCashback('');

        Swal.fire({
          icon: 'success',
          title: 'Cashback validado!',
          html: `
            <p><strong>Cliente:</strong> ${clienteValidacao.nome_completo}</p>
            <p><strong>Valor utilizado:</strong> R$ ${valorNum.toFixed(2)}</p>
            <p><strong>Novo saldo:</strong> R$ ${(clienteValidacao.saldo - valorNum).toFixed(2)}</p>
          `,
          confirmButtonColor: '#FF4757'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro ao validar',
          text: 'Erro ao processar validação de cashback',
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

  // Função para cadastrar uma nova transação
  const cadastrarTransacao = async (valor: number, observacao: string = '') => {
    if (!currentUser) return;

    try {
      const response = await fetch('http://localhost:3001/api/transacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: currentUser.id,
          tipo: 'compra',
          valor: valor,
          observacao: observacao || `Abastecimento de R$ ${valor.toFixed(2)}`
        }),
      });

      if (response.ok) {
        // Calcular pontos: 2% do valor (R$ 1 = 2 pontos)
        const pontosGanhos = Math.floor(valor * 2);
        
        // Atualizar pontos do usuário
        const novosPontos = (currentUser.pontos || 0) + pontosGanhos;

        // Atualizar pontos no backend
        await fetch(`http://localhost:3001/api/usuarios/${currentUser.id}/saldo`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            pontos: novosPontos 
          }),
        });

        setCurrentUser({
          ...currentUser, 
          pontos: novosPontos
        });
        
        alert(`✅ Transação registrada!\n⭐ Pontos ganhos: ${pontosGanhos}\n📊 Total de pontos: ${novosPontos}`);
      }
    } catch (error) {
      console.error('Erro ao cadastrar transação:', error);
      alert('❌ Erro ao cadastrar transação');
    }
  };

  // Função para converter pontos em cashback
  const converterPontosEmCashback = async () => {
    if (!currentUser) return;

    const pontosNum = parseInt(pontosParaConverter);
    
    // Validações
    if (!pontosNum || pontosNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor inválido',
        text: 'Digite um valor válido de pontos',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (pontosNum > (currentUser.pontos || 0)) {
      Swal.fire({
        icon: 'warning',
        title: 'Pontos insuficientes',
        text: 'Você não tem pontos suficientes para esta conversão',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (pontosNum < 100) {
      Swal.fire({
        icon: 'warning',
        title: 'Quantidade insuficiente',
        text: 'O mínimo para conversão é 100 pontos (R$ 1,00)',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    try {
      // Calcular conversão: 100 pontos = R$ 1,00
      const cashbackGerado = pontosNum / 100;
      const novosPontos = (currentUser.pontos || 0) - pontosNum;
      const novoSaldo = (currentUser.saldo || 0) + cashbackGerado;

      // Atualizar no backend
      const response = await fetch(`http://localhost:3001/api/usuarios/${currentUser.id}/saldo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          saldo: novoSaldo,
          pontos: novosPontos 
        }),
      });

      if (response.ok) {
        // Atualizar estado local
        setCurrentUser({
          ...currentUser, 
          saldo: novoSaldo,
          pontos: novosPontos
        });

        // Fechar modal e limpar campo
        setShowConversaoModal(false);
        setPontosParaConverter('');

        Swal.fire({
          icon: 'success',
          title: 'Conversão realizada!',
          html: `
            <p>⭐ <strong>${pontosNum} pontos</strong> foram convertidos</p>
            <p>💰 <strong>R$ ${cashbackGerado.toFixed(2)}</strong> adicionados ao seu cashback</p>
          `,
          confirmButtonColor: '#10b981'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro na conversão',
          text: 'Erro ao processar conversão de pontos',
          confirmButtonColor: '#FF4757'
        });
      }
    } catch (error) {
      console.error('Erro na conversão:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está funcionando',
        confirmButtonColor: '#FF4757'
      });
    }
  };

  // Função para abrir modal de conversão
  const abrirModalConversao = () => {
    console.log('🔍 Abrindo modal de conversão...');
    console.log('Pontos do usuário:', currentUser?.pontos);
    
    setShowConversaoModal(true);
  };

  // Função para abrir modal de extrato de pontos
  const abrirModalExtrato = () => {
    setShowExtratoModal(true);
  };

  // Função para abrir modal de utilizar cashback
  const abrirModalUtilizarCashback = () => {
    setShowUtilizarCashbackModal(true);
    setCodigoGerado(null);
    setValorUtilizarCashback('');
  };

  // Função para gerar código de cashback
  const gerarCodigoCashback = async () => {
    if (!currentUser) return;

    const valorNum = valorParaNumero(valorUtilizarCashback);
    
    // Validações
    if (!valorNum || valorNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor inválido',
        text: 'Digite um valor válido para o cashback',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (valorNum < 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor muito baixo',
        text: 'O valor mínimo para utilizar cashback é R$ 5,00',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    if (valorNum > (currentUser.saldo || 0)) {
      Swal.fire({
        icon: 'warning',
        title: 'Saldo insuficiente',
        text: 'Você não tem saldo suficiente para esta operação',
        confirmButtonColor: '#FF4757'
      });
      return;
    }

    try {
      // Gera código alfanumérico de 8 caracteres
      const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();

      const response = await fetch('http://localhost:3001/api/gerar-codigo-cashback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: currentUser.id,
          valor: valorNum,
          codigo: codigo
        }),
      });

      if (response.ok) {
        setCodigoGerado(codigo);
        
        // Modal bonito para exibir o código gerado
        Swal.fire({
          title: '✅ Código Gerado!',
          html: `
            <div style="text-align: center; padding: 1rem;">
              <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; border-radius: 12px; padding: 1.5rem; margin: 1rem 0;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem;">💰 Seu Código de Cashback</h3>
                <div style="background: rgba(255, 255, 255, 0.2); border: 2px dashed rgba(255, 255, 255, 0.5); border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                  <span style="font-family: 'Courier New', monospace; font-size: 2rem; font-weight: 700; letter-spacing: 0.3rem; color: #fff;">${codigo}</span>
                </div>
                <p style="margin: 1rem 0 0 0; font-size: 0.95rem; line-height: 1.5; opacity: 0.95;">
                  📱 <strong>Valor:</strong> R$ ${valorNum.toFixed(2)}<br/>
                  ⏰ <strong>Válido por:</strong> 30 minutos<br/>
                  👨‍💼 <strong>Mostre este código para o funcionário</strong>
                </p>
              </div>
              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; color: #92400e;">
                <p style="margin: 0; font-size: 0.9rem;">
                  💡 <strong>Importante:</strong> Guarde este código e apresente na hora do pagamento!
                </p>
              </div>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'OK, Entendi!',
          confirmButtonColor: '#10b981',
          allowOutsideClick: false,
          customClass: {
            popup: 'codigo-success-modal'
          }
        }).then(() => {
          // Fecha o modal principal e volta para a página inicial
          setShowUtilizarCashbackModal(false);
          setValorUtilizarCashback('');
          setCodigoGerado(null);
        });
      } else {
        const data = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Erro ao gerar código',
          text: data.erro || 'Ocorreu um erro inesperado',
          confirmButtonColor: '#FF4757'
        });
      }
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique se o servidor está rodando',
        confirmButtonColor: '#FF4757'
      });
    }
  };

  // Função para filtrar transações dos últimos 30 dias
  const getTransacoesUltimos30Dias = () => {
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    return transactions.filter(transaction => {
      const dataTransacao = new Date(transaction.data_transacao);
      return dataTransacao >= trintaDiasAtras && dataTransacao <= hoje;
    }).sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());
  };

  // Funções do carrossel
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
  };

  // Touch/Swipe handlers for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
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
                <div className="tipo-descricao">Acessar conta e ver pontos</div>
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
                <span className="nav-icon">💰</span>
                <span className="nav-text">Validar Cashback</span>
              </button>
            </div>

            <div className="funcionario-main">
              {paginaFuncionario === 'abastecimento' ? (
                <div className="abastecimento-unified">
                  <div className="funcionario-section-unified">
                    <div className="section-header">
                      <div className="section-icon">⛽</div>
                      <h3 className="section-title-func">Registrar Abastecimento</h3>
                    </div>
                    
                    <div className="form-steps">
                      {/* Passo 1: Buscar Cliente */}
                      <div className="form-step">
                        <div className="step-header">
                          <span className="step-number">1</span>
                          <h4 className="step-title">Buscar Cliente</h4>
                        </div>
                        
                        <div className="input-container">
                          <label className="input-label">CPF do Cliente</label>
                          <input
                            type="text"
                            value={cpfCliente}
                            onChange={(e) => handleCpfChange(e.target.value, setCpfCliente)}
                            className="input-field"
                            placeholder="000.000.000-00"
                            maxLength={14}
                          />
                          <button 
                            onClick={buscarCliente}
                            className="search-button"
                            disabled={loading}
                          >
                            <span className="button-icon">🔍</span>
                            <span className="button-text">{loading ? 'Buscando...' : 'Buscar Cliente'}</span>
                          </button>
                        </div>
                        
                        {clienteEncontrado && (
                          <div className="cliente-card">
                            <div className="cliente-status">
                              <span className="status-icon">✅</span>
                              <span className="status-text">Cliente Encontrado</span>
                            </div>
                            <div className="cliente-details">
                              <div className="detail-item">
                                <span className="detail-label">Nome:</span>
                                <span className="detail-value">{clienteEncontrado.nome_completo}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{clienteEncontrado.email}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Saldo Atual:</span>
                                <span className="detail-value highlight">R$ {clienteEncontrado.saldo.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Passo 2: Dados do Abastecimento */}
                      <div className="form-step">
                        <div className="step-header">
                          <span className="step-number">2</span>
                          <h4 className="step-title">Dados do Abastecimento</h4>
                        </div>
                        
                        <div className="form-fields-abastecimento">
                          <div className="input-container">
                            <label className="input-label">Tipo de Combustível</label>
                            <select
                              value={combustivel}
                              onChange={(e) => setCombustivel(e.target.value)}
                              className="input-field select-field"
                            >
                              <option value="">Selecione o combustível</option>
                              <option value="Gasolina Comum">⛽ Gasolina Comum</option>
                              <option value="Gasolina Aditivada">⛽ Gasolina Aditivada</option>
                              <option value="Diesel S-500">🚛 Diesel S-500</option>
                              <option value="Diesel S-10">🚛 Diesel S-10</option>
                            </select>
                          </div>

                          <div className="input-container">
                            <label className="input-label">Forma de Pagamento</label>
                            <select
                              value={formaPagamento}
                              onChange={(e) => setFormaPagamento(e.target.value)}
                              className="input-field select-field"
                            >
                              <option value="">Selecione a forma de pagamento</option>
                              <option value="PIX/Dinheiro/Débito">💳 PIX/Dinheiro/Débito</option>
                              <option value="Crédito">💴 Crédito</option>
                            </select>
                          </div>

                          <div className="input-container">
                            <label className="input-label">Valor Total</label>
                            <input
                              type="text"
                              value={valorTotal}
                              onChange={(e) => handleValorChange(e.target.value)}
                              className="input-field money-field"
                              placeholder="R$ 0,00"
                            />
                          </div>
                        </div>
                        
                        <button 
                          onClick={registrarAbastecimento}
                          className="register-button-final"
                          disabled={loading || !clienteEncontrado}
                        >
                          <span className="button-icon">💳</span>
                          <span className="button-text">{loading ? 'Processando...' : 'Registrar Abastecimento'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : paginaFuncionario === 'validar-cashback' ? (
                <div className="abastecimento-unified">
                  <div className="funcionario-section-unified">
                    <div className="section-header">
                      <div className="section-icon">💰</div>
                      <h3 className="section-title-func">Validar Código de Cashback</h3>
                    </div>
                    
                    <div className="validacao-info">
                      <p>💡 <strong>Como funciona:</strong></p>
                      <ul>
                        <li>🎫 O cliente gera um código no app</li>
                        <li>⏰ Códigos são válidos por 30 minutos</li>
                        <li>💳 Digite o código abaixo para validar</li>
                      </ul>
                    </div>
                    
                    <div className="form-steps">
                      {/* Validação de Código */}
                      <div className="form-step">
                        <div className="step-header">
                          <span className="step-number">💳</span>
                          <h4 className="step-title">Código do Cliente</h4>
                        </div>
                        
                        <div className="input-container">
                          <label className="input-label">Código de Cashback</label>
                          <input
                            type="text"
                            value={codigoValidacao}
                            onChange={(e) => setCodigoValidacao(e.target.value.toUpperCase())}
                            className="input-field codigo-field"
                            placeholder="Ex: AB12CD34"
                            maxLength={8}
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '1.2rem',
                              letterSpacing: '0.2rem',
                              textAlign: 'center'
                            }}
                          />
                          <small className="input-help">
                            Digite o código alfanumérico de 8 caracteres fornecido pelo cliente
                          </small>
                        </div>
                        
                        <button 
                          onClick={validarCodigoCashback}
                          className="register-button-final"
                          disabled={loading || !codigoValidacao.trim() || codigoValidacao.length < 8}
                        >
                          <span className="button-icon">✅</span>
                          <span className="button-text">{loading ? 'Validando...' : 'Validar Código'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
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
            <h1 className="header-title">Bom dia, {currentUser.nome_completo.split(' ')[0]}!</h1>
          </div>
          <div className="user-info">
            <button onClick={handleLogout} className="btn-logout">
              Sair
            </button>
          </div>
        </header>

        <main className="main-content">
          {/* Cards horizontais */}
          <div className="cards-grid">
            <div className="card yellow">
              <div className="card-icon">⭐</div>
              <div className="card-content">
                <span className="card-label">Extrato de Pontos</span>
                <span className="card-value">{currentUser.pontos || 0} Pontos</span>
              </div>
            </div>
            <div className="card green">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <span className="card-label">Saldo de Cashback</span>
                <span className="card-value">R$ {(currentUser.saldo || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="card blue">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <span className="card-label">Minhas Compras</span>
                <span className="card-value">{transactions.length}</span>
              </div>
            </div>
            <div className="card red">
              <div className="card-icon">💸</div>
              <div className="card-content">
                <span className="card-label">Total Gasto</span>
                <span className="card-value">R$ {transactions.reduce((total, t) => total + t.valor, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Ícones de ação */}
          <div className="action-icons">
            <a 
              href="https://www.google.com/maps/search/?api=1&query=R.+Estrela+D%27álva,+1794+-+Profa.+Araceli+Souto+Maior,+Boa+Vista+-+RR,+69315-076"
              target="_blank"
              rel="noopener noreferrer"
              className="action-icon"
            >
              <div className="action-icon-circle">📍</div>
              <span className="action-icon-text">Onde Estamos</span>
            </a>
            <div className="action-icon" onClick={abrirModalExtrato}>
              <div className="action-icon-circle">📊</div>
              <span className="action-icon-text">Extrato De Pontos</span>
            </div>
            <div className="action-icon" onClick={abrirModalConversao}>
              <div className="action-icon-circle">💰</div>
              <span className="action-icon-text">Converter Cashback</span>
            </div>
            <div className="action-icon" onClick={abrirModalUtilizarCashback}>
              <div className="action-icon-circle">💳</div>
              <span className="action-icon-text">Utilizar Cashback</span>
            </div>
          </div>

          {/* Seção de recompensas */}
          <div className="rewards-section">
            <div className="rewards-header">
              <div className="rewards-title">
                <span className="rewards-icon">🎁</span>
                <span>Minhas Recompensas</span>
              </div>
              <span className="rewards-arrow">›</span>
            </div>
            <div className="rewards-progress">0%</div>
            <div className="rewards-subtitle">Acompanhe suas metas aqui</div>
          </div>

          {/* Preços dos combustíveis */}
          <div className="fuel-prices">
            <h3 className="fuel-prices-title">PONTOS EM DOBRO PIX/DINHEIRO</h3>
            <div className="fuel-item">
              <div className="fuel-info">
                <div className="fuel-icon">⛽</div>
                <span className="fuel-name">G. COMUM</span>
              </div>
              <span className="fuel-price">R$ {(6.94 * 0.98).toFixed(2)}/L</span>
            </div>
            <div className="fuel-item">
              <div className="fuel-info">
                <div className="fuel-icon">⛽</div>
                <span className="fuel-name">G. ADIT.</span>
              </div>
              <span className="fuel-price">R$ {(6.99 * 0.98).toFixed(2)}/L</span>
            </div>
            <div className="fuel-item">
              <div className="fuel-info">
                <div className="fuel-icon">🚛</div>
                <span className="fuel-name">D. S-500</span>
              </div>
              <span className="fuel-price">R$ {(6.85 * 0.98).toFixed(2)}/L</span>
            </div>
            <div className="fuel-item">
              <div className="fuel-info">
                <div className="fuel-icon">🚛</div>
                <span className="fuel-name">D. S-10</span>
              </div>
              <span className="fuel-price">R$ {(6.95 * 0.98).toFixed(2)}/L</span>
            </div>
          </div>

          {/* Carrossel de Promoções */}
          <div className="promotions-carousel">
            <div className="carousel-container"
                 onTouchStart={onTouchStart}
                 onTouchMove={onTouchMove}
                 onTouchEnd={onTouchEnd}
            >
              <div className="carousel-track">
                <div className={`carousel-slide ${currentSlide === 0 ? 'active' : ''}`}>
                  <img 
                    src="/promocao1.jpg" 
                    alt="Promoção 1 - Auto Posto Estrela D'Alva" 
                    className="carousel-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="carousel-fallback" style={{ display: 'none' }}>
                    <span className="fallback-icon">🎯</span>
                    <span className="fallback-text">Promoção 1</span>
                  </div>
                </div>
                
                <div className={`carousel-slide ${currentSlide === 1 ? 'active' : ''}`}>
                  <img 
                    src="/promocao2.jpg" 
                    alt="Promoção 2 - Auto Posto Estrela D'Alva" 
                    className="carousel-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="carousel-fallback" style={{ display: 'none' }}>
                    <span className="fallback-icon">🔥</span>
                    <span className="fallback-text">Promoção 2</span>
                  </div>
                </div>
                
                <div className={`carousel-slide ${currentSlide === 2 ? 'active' : ''}`}>
                  <img 
                    src="/promocao3.jpg" 
                    alt="Promoção 3 - Auto Posto Estrela D'Alva" 
                    className="carousel-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="carousel-fallback" style={{ display: 'none' }}>
                    <span className="fallback-icon">⚡</span>
                    <span className="fallback-text">Promoção 3</span>
                  </div>
                </div>
              </div>
              
              <div className="carousel-indicators">
                {[...Array(totalSlides)].map((_, index) => (
                  <span 
                    key={index}
                    className={`indicator ${currentSlide === index ? 'active' : ''}`} 
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Promoção */}
          <div className="promotions-section">
            <div className="promotion-card">
              <h3 className="promotion-title">🎉 Promoção Especial!</h3>
              <p>Ganhei pontos em dobro nos próximos 7 dias!</p>
            </div>
          </div>


        </main>

        {/* Modal de conversão de pontos */}
        {showConversaoModal && (
          <div className="modal-overlay" onClick={() => setShowConversaoModal(false)}>
            <div className="modal-content conversion-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>💰 Converter Pontos em Cashback</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowConversaoModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="conversion-info">
                  <div className="info-card">
                    <h3>📊 Seus Pontos</h3>
                    <p className="points-available">{currentUser?.pontos || 0} pontos disponíveis</p>
                  </div>
                </div>

                {(!currentUser?.pontos || currentUser.pontos < 100) ? (
                  <div className="insufficient-points">
                    <div className="warning-message">
                      <h3>⚠️ Pontos Insuficientes</h3>
                      <p>Você precisa de pelo menos <strong>100 pontos</strong> para fazer uma conversão.</p>
                      <p>💡 <strong>Como ganhar pontos:</strong></p>
                      <ul>
                        <li>🛒 Faça abastecimentos no posto (2% do valor em pontos)</li>
                        <li>⭐ R$ 1,00 gasto = 2 pontos ganhos</li>
                        <li>💰 R$ 50,00 gasto = 100 pontos = R$ 1,00 cashback</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="conversion-form">
                    <div className="form-group">
                      <label>Quantos pontos deseja converter?</label>
                      <input
                        type="number"
                        value={pontosParaConverter}
                        onChange={(e) => setPontosParaConverter(e.target.value)}
                        placeholder="Digite a quantidade de pontos"
                        min="100"
                        max={currentUser?.pontos || 0}
                        step="100"
                        className="form-input"
                      />
                      <small className="input-help">
                        Mínimo: 100 pontos | Máximo: {currentUser?.pontos || 0} pontos
                      </small>
                    </div>

                    {pontosParaConverter && parseInt(pontosParaConverter) >= 100 && (
                      <div className="conversion-preview">
                        <h4>💰 Prévia da Conversão:</h4>
                        <div className="preview-details">
                          <p>⭐ Pontos a converter: {pontosParaConverter}</p>
                          <p>💵 Cashback que receberá: R$ {(parseInt(pontosParaConverter) / 100).toFixed(2)}</p>
                          <p>📊 Pontos restantes: {(currentUser?.pontos || 0) - parseInt(pontosParaConverter)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowConversaoModal(false)}
                  >
                    {(!currentUser?.pontos || currentUser.pontos < 100) ? 'Fechar' : 'Cancelar'}
                  </button>
                  {(currentUser?.pontos && currentUser.pontos >= 100) && (
                    <button 
                      className="btn-primary"
                      onClick={converterPontosEmCashback}
                      disabled={!pontosParaConverter || parseInt(pontosParaConverter) < 100}
                    >
                      Converter Pontos
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal do Extrato de Pontos */}
        {showExtratoModal && (
          <div className="modal-overlay" onClick={() => setShowExtratoModal(false)}>
            <div className="modal-content extrato-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📊 Extrato de Pontos - Últimos 30 Dias</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowExtratoModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="extrato-info">
                  <div className="extrato-summary">
                    <div className="summary-item">
                      <span className="summary-label">Total de Pontos Atual:</span>
                      <span className="summary-value">{currentUser?.pontos || 0} pontos</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Transações (30 dias):</span>
                      <span className="summary-value">{getTransacoesUltimos30Dias().length} transações</span>
                    </div>
                  </div>
                </div>

                <div className="extrato-transactions">
                  <h3>📝 Histórico de Transações</h3>
                  {getTransacoesUltimos30Dias().length > 0 ? (
                    <div className="transactions-list">
                      {getTransacoesUltimos30Dias().map((transaction, index) => (
                        <div key={index} className="transaction-item">
                          <div className="transaction-header">
                            <div className="transaction-date">
                              {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="transaction-fuel">{transaction.combustivel}</div>
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-amount">
                              <span className="amount-label">Valor:</span>
                              <span className="amount-value">R$ {transaction.valor.toFixed(2)}</span>
                            </div>
                            <div className="transaction-points">
                              <span className="points-label">Pontos ganhos:</span>
                              <span className="points-value">
                                +{transaction.pontos || Math.floor(transaction.valor * 2)} pontos
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-transactions">
                      <p>📝 Nenhuma transação encontrada nos últimos 30 dias.</p>
                      <p>Faça um abastecimento para começar a ganhar pontos!</p>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowExtratoModal(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de utilizar cashback */}
        {showUtilizarCashbackModal && (
          <div className="modal-overlay" onClick={() => setShowUtilizarCashbackModal(false)}>
            <div className="modal-content utilizar-cashback-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>💳 Utilizar Cashback</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowUtilizarCashbackModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="cashback-info">
                  <div className="info-card">
                    <h3>💰 Seu Saldo</h3>
                    <p className="saldo-disponivel">R$ {(currentUser?.saldo || 0).toFixed(2)} disponível</p>
                  </div>
                </div>

                {(!currentUser?.saldo || currentUser.saldo < 5) ? (
                  <div className="insufficient-cashback">
                    <div className="warning-message">
                      <h3>⚠️ Saldo Insuficiente</h3>
                      <p>Você precisa de pelo menos <strong>R$ 5,00</strong> para utilizar cashback.</p>
                      <p>💡 <strong>Como ganhar cashback:</strong></p>
                      <ul>
                        <li>⭐ Converta seus pontos em cashback</li>
                        <li>💰 100 pontos = R$ 1,00 cashback</li>
                        <li>🛒 Acumule pontos fazendo abastecimentos</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="cashback-form">
                    <div className="form-group">
                      <label>Quanto deseja utilizar?</label>
                      <input
                        type="text"
                        value={valorUtilizarCashback}
                        onChange={(e) => setValorUtilizarCashback(formatarMoeda(e.target.value))}
                        placeholder="R$ 0,00"
                        className="form-input"
                      />
                      <small className="input-help">
                        Mínimo: R$ 5,00 | Máximo: R$ {(currentUser?.saldo || 0).toFixed(2)}
                      </small>
                    </div>

                    {valorUtilizarCashback && valorParaNumero(valorUtilizarCashback) >= 5 && (
                      <div className="cashback-preview">
                        <h4>💳 Prévia da Utilização:</h4>
                        <div className="preview-details">
                          <p>💰 Valor a utilizar: {valorUtilizarCashback}</p>
                          <p>📊 Saldo restante: R$ {((currentUser?.saldo || 0) - valorParaNumero(valorUtilizarCashback)).toFixed(2)}</p>
                        </div>
                      </div>
                    )}


                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowUtilizarCashbackModal(false)}
                  >
                    {(!currentUser?.saldo || currentUser.saldo < 5) ? 'Fechar' : 'Cancelar'}
                  </button>
                  {(currentUser?.saldo && currentUser.saldo >= 5) && (
                    <button 
                      className="btn-primary"
                      onClick={gerarCodigoCashback}
                      disabled={!valorUtilizarCashback || valorParaNumero(valorUtilizarCashback) < 5}
                    >
                      Gerar Código
                    </button>
                  )}
                </div>
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
            <h3>Pontos Distribuídos</h3>
            <p className="admin-value green">
              {transactions.reduce((total, t) => total + (t.pontos || Math.floor(t.valor * 2)), 0)} pontos
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
                  <p className="transaction-points">Pontos: +{transaction.pontos || Math.floor(transaction.valor * 2)}</p>
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
