import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      // Usaremos o toast do sonner para mostrar mensagens
      const event = new CustomEvent('show-toast', { 
        detail: { 
          message: 'Por favor, preencha todos os campos',
          type: 'error'
        } 
      });
      window.dispatchEvent(event);
      return;
    }

    setIsLoading(true);
    
    try {
      // Autenticação real com o Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Dispara um evento para atualizar o cabeçalho
      window.dispatchEvent(new Event('storage'));
      
      // Redireciona para a página inicial após o login
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
      
      // Mostra mensagem de sucesso
      const event = new CustomEvent('show-toast', { 
        detail: { 
          message: 'Login realizado com sucesso!',
          type: 'success'
        } 
      });
      window.dispatchEvent(event);
      
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Credenciais inválidas. Tente novamente.';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'E-mail ou senha incorretos.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor, verifique seu e-mail para confirmar sua conta.';
      }
      
      // Mostra mensagem de erro
      const event = new CustomEvent('show-toast', { 
        detail: { 
          message: errorMessage,
          type: 'error'
        } 
      });
      window.dispatchEvent(event);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-green-50 to-green-100 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Cabeçalho Mobile */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-green-700">
        <div className="flex items-center">
          <img 
            src="/file_00000000752461f89c07fa2b32ca50d32.png" 
            alt="MariaPass" 
            className="h-12 w-auto mr-3"
          />
          <h1 className="text-2xl font-bold text-white">
            <span className="text-pink-300">Maria</span>
            <span className="text-blue-300">Pass</span>
          </h1>
        </div>
      </div>

      {/* Coluna 1 - Mensagem de Boas-vindas */}
      <div className="hidden lg:flex flex-col w-full lg:w-1/3 bg-gradient-to-b from-green-600 to-green-700 text-white min-h-screen">
        <div className="flex flex-col items-center p-4 sm:p-6 w-full max-w-md mx-auto text-center">
          <div className="mb-6">
            <svg className="h-14 w-14 mx-auto mb-3 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h2 className="text-3xl font-bold mb-3">Bem-vindo ao <span className="text-pink-500">Maria</span><span className="text-blue-600">Pass</span></h2>
            <div className="w-16 h-1 bg-green-400 mx-auto my-3"></div>
            <p className="text-green-100 text-sm">Sua solução completa para gestão de pagamentos e relacionamento com clientes.</p>
          </div>
          
          <div className="space-y-4 w-full mb-6">
            <div className="bg-green-700 bg-opacity-40 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-green-100">Gestão Completa</h3>
              <p className="text-green-100 text-sm">Controle total sobre suas vendas, clientes e finanças em um único lugar.</p>
            </div>
            
            <div className="bg-green-700 bg-opacity-40 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-green-100">Segurança Garantida</h3>
              <p className="text-green-100 text-sm">Seus dados protegidos com as melhores práticas de segurança do mercado.</p>
            </div>
            
            <div className="bg-green-700 bg-opacity-40 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-green-100">Relatórios Detalhados</h3>
              <p className="text-green-100 text-sm mb-2">Tenha insights valiosos sobre o desempenho do seu negócio a qualquer momento.</p>
              <p className="text-green-100 text-xs">Acompanhe métricas importantes e tome decisões baseadas em dados para impulsionar suas vendas.</p>
            </div>

            <div className="bg-green-700 bg-opacity-40 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-green-100">Pagamentos Integrados</h3>
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="bg-purple-500 text-white p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.1-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="bg-yellow-500 text-white p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-green-100 text-sm">Aceite pagamentos via PIX e Boleto de forma simples e segura.</p>
              <p className="text-green-100 text-xs mt-1">Processamento rápido e taxas competitivas para o seu negócio.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna 2 - Formulário de login */}
      <div className="w-full lg:w-1/3 bg-green-50 border-x border-gray-100 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-xs sm:max-w-md my-8">
          <div className="flex flex-col items-center justify-center w-full">
            <div className="mb-6">
              <img 
                src="/file_00000000752461f89c07fa2b32ca50d32.png" 
                alt="MariaPass" 
                className="h-32 w-auto mx-auto"
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sistema de Gestão Comercial</h2>
            <h1 className="text-4xl font-bold text-center mb-2">
              <span className="text-pink-500">Maria</span>
              <span className="text-blue-500">Pass</span>
            </h1>
            <p className="text-sm text-gray-500">Acesso ao Sistema</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none focus:ring-green-200"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none focus:ring-green-200"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Lembrar de mim
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-green-600 hover:text-green-500">
                  Esqueceu sua senha?
                </a>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Carregando...' : 'Acessar'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Coluna 3 - Parcerias */}
      <div className="hidden lg:flex flex-col w-full lg:w-1/3 bg-gradient-to-b from-green-700 to-green-800 text-white min-h-screen">
        <div className="sticky top-0 bg-gradient-to-b from-green-700 to-green-800 py-4 z-10 px-4 sm:px-6">
          <h2 className="text-lg sm:text-xl font-bold text-center">PARCEIRO OFICIAL</h2>
        </div>
        <div className="flex-1 p-4 sm:p-6">
          <div className="w-full max-w-md mx-auto">
            {/* Logos dos parceiros */}
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 mb-6">
              <img 
                src="/Imagem colada (2).png" 
                alt="Stone"
                className="h-12 object-contain"
              />
              <img 
                src="/Imagem colada (3).png" 
                alt="Pagar.me"
                className="h-12 object-contain"
              />
              <img 
                src="/Imagem colada (4).png" 
                alt="Stone Partner" 
                className="h-12 object-contain"
              />
            </div>
            
            {/* Banner de parceiro oficial */}
            <div className="bg-green-500 bg-opacity-30 p-3 sm:p-4 rounded-lg mb-6">
              <p className="text-green-100 font-medium text-sm">CREDIBILIDADE E CONFIABILIDADE</p>
              <p className="text-white font-bold text-lg">PARCEIRO OFICIAL</p>
              <p className="text-green-100 text-xs mt-1">Stone • Pagar.me • Stone Partner Program</p>
            </div>
            
            {/* Seção de Integração de Pagamentos */}
            <div className="bg-green-800 bg-opacity-40 p-4 sm:p-6 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-2xl">💳</span>
                <h3 className="font-bold text-lg text-center">Integração de Pagamentos</h3>
              </div>
              
              <p className="text-green-100 text-xs sm:text-sm mb-4 text-center">
                Soluções completas para terminais Android com integração Stone. 
                Processamento de pagamentos seguro, rápido e confiável para o seu negócio.
              </p>
              
              <div className="flex justify-center gap-1">
                <img 
                  src="/Imagem colada.png" 
                  alt="Processamento de pagamentos" 
                  className="h-20 sm:h-28 object-contain"
                />
                <img 
                  src="/la400.png" 
                  alt="Integração de pagamentos" 
                  className="h-20 sm:h-28 object-contain"
                />
                <img 
                  src="/Imagem colada (1).png" 
                  alt="Maquininha de cartão" 
                  className="h-20 sm:h-28 object-contain"
                />
              </div>
            </div>
            
            <p className="text-green-100 text-xs text-center mt-4 px-4 break-words">
              Ofereça todas as formas de pagamento aos seus clientes com as melhores taxas do mercado.
            </p>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-gradient-to-t from-green-700 to-green-800 py-6 px-4 border-t border-green-600">
          <div className="text-center text-xs text-gray-300 mb-2">
            {new Date().getFullYear()} MariaPass. Todos os direitos reservados.
          </div>
          <div className="max-w-md mx-auto text-center">
            <p className="text-green-200 text-sm font-medium">© 2025 Rodrigo Dev MT</p>
            <div className="flex flex-wrap justify-center gap-2 mt-1 text-xs text-green-300">
              <a href="mailto:developer@rodrigodevmt.com.br" className="hover:text-white hover:underline">
                developer@rodrigodevmt.com.br
              </a>
              <span>•</span>
              <a href="tel:+5566992258469" className="hover:text-white hover:underline">
                (66) 99225-8469
              </a>
              <span>•</span>
              <a href="https://www.rodrigodevmt.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                www.rodrigodevmt.com.br
              </a>
            </div>
            <p className="text-green-200 text-xs mt-2">
              © {new Date().getFullYear()} MariaPass. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
