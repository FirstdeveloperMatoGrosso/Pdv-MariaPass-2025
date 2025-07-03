
// Verificação de ambiente (remova após o teste)
import { useEffect } from 'react';

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
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
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

const App = () => {
  console.log('App component loaded');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <div className="flex-shrink-0">
                <AppSidebar />
              </div>
              <SidebarInset className="pr-2" style={{ zoom: 0.85, flex: '1 1 auto' }}>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Sistema de Totem - MariaPass</span>
                  </div>
                </header>
                <main className="flex-1 p-2 pr-4">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/vendas" element={<Vendas />} />
                    <Route path="/produtos" element={<Produtos />} />
                    <Route path="/importar-excel" element={<ImportarExcel />} />
                    <Route path="/relatorios" element={<Relatorios />} />
                    <Route path="/cancelamentos" element={<Cancelamentos />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/impressoes" element={<ImpressoesVendas />} />
                    <Route path="/terminais" element={<Terminais />} />
                    <Route path="/acesso" element={<ControleAcesso />} />
                    <Route path="/vouchers" element={<Vouchers />} />
                    <Route path="/recarga-pulseiras" element={<RecargaPulseiras />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/integracao-nota-fiscal" element={<IntegracaoNotaFiscal />} />
                    <Route path="/integracao-boleto" element={<IntegracaoBoleto />} />
                    <Route path="/integracao-nfce" element={<IntegracaoNFCe />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
