
// Verificação de ambiente (remova após o teste)

// Teste de variáveis de ambiente
const checkEnvVars = () => {
  console.log('=== VERIFICAÇÃO DE AMBIENTE ===');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || '❌ Não definida');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida');
  
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ ERRO: Variáveis de ambiente do Supabase não encontradas!');
    console.info('Certifique-se de que o arquivo .env está configurado corretamente na raiz do projeto.');
  } else {
    try {
      new URL(import.meta.env.VITE_SUPABASE_URL);
      console.log('✅ URL do Supabase é válida');
    } catch (e) {
      console.error('❌ ERRO: URL do Supabase inválida:', import.meta.env.VITE_SUPABASE_URL);
    }
  }
  console.log('==============================');
};

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { AppHeader } from "./components/AppHeader";
import Index from "./pages/Index";
import Produtos from "./pages/Produtos";
import ImportarExcel from "./pages/ImportarExcel";
import Vendas from "./pages/Vendas";
import Relatorios from "./pages/Relatorios";
import Cancelamentos from "./pages/Cancelamentos";
import Estoque from "./pages/Estoque";
import ImpressoesVendas from "./pages/ImpressoesVendas";
import Terminais from "./pages/Terminais";
import ControleAcesso from "./pages/ControleAcesso";
import Vouchers from "./pages/Vouchers";
import RecargaPulseiras from "./pages/RecargaPulseiras";
import Configuracoes from "./pages/Configuracoes";
import IntegracaoNotaFiscal from "./pages/IntegracaoNotaFiscal";
import IntegracaoBoleto from "./pages/IntegracaoBoleto";
import IntegracaoNFCe from "./pages/IntegracaoNFCe";
import Clientes from "./pages/Clientes";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Create QueryClient outside of component to avoid recreation on each render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente para proteger rotas autenticadas
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Verificar se o usuário está autenticado
    // Na implementação real, você verificaria o token JWT ou estado de autenticação
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, [location]);

  if (isAuthenticated === null) {
    // Mostrar um loading enquanto verifica a autenticação
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para a página de login se não estiver autenticado
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas"
        element={
          <ProtectedRoute>
            <Vendas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos"
        element={
          <ProtectedRoute>
            <Produtos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/importar-excel"
        element={
          <ProtectedRoute>
            <ImportarExcel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute>
            <Relatorios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cancelamentos"
        element={
          <ProtectedRoute>
            <Cancelamentos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estoque"
        element={
          <ProtectedRoute>
            <Estoque />
          </ProtectedRoute>
        }
      />
      <Route
        path="/impressoes"
        element={
          <ProtectedRoute>
            <ImpressoesVendas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/terminais"
        element={
          <ProtectedRoute>
            <Terminais />
          </ProtectedRoute>
        }
      />
      <Route
        path="/acesso"
        element={
          <ProtectedRoute>
            <ControleAcesso />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vouchers"
        element={
          <ProtectedRoute>
            <Vouchers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recarga-pulseiras"
        element={
          <ProtectedRoute>
            <RecargaPulseiras />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <Configuracoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracao-nota-fiscal"
        element={
          <ProtectedRoute>
            <IntegracaoNotaFiscal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracao-boleto"
        element={
          <ProtectedRoute>
            <IntegracaoBoleto />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracao-nfce"
        element={
          <ProtectedRoute>
            <IntegracaoNFCe />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Componente para renderizar rotas protegidas
const ProtectedLayout = ({ children }: { children: React.ReactElement }) => {
  return (
    <div className="min-h-screen bg-green-50 w-screen overflow-x-hidden">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <SidebarInset className="flex-1 overflow-auto">
              <ProtectedRoute>
                <div className="min-h-[calc(100vh-3.5rem)] w-full">
                  {children}
                </div>
              </ProtectedRoute>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

const App = () => {
  console.log('App component loaded');
  
  // Efeito para lidar com mensagens de toast personalizadas
  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type: 'success' | 'error' | 'info' }>;
      const { message, type = 'info' } = customEvent.detail || {};
      
      if (message) {
        // Usando o sonner para mostrar as notificações
        const sonnerEvent = new CustomEvent('sonner-toast', {
          detail: {
            message,
            type
          }
        });
        window.dispatchEvent(sonnerEvent);
      }
    };

    window.addEventListener('show-toast', handleToast as EventListener);
    return () => {
      window.removeEventListener('show-toast', handleToast as EventListener);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/*" 
                  element={
                    <ProtectedLayout>
                      <AppRoutes />
                    </ProtectedLayout>
                  } 
                />
              </Routes>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
