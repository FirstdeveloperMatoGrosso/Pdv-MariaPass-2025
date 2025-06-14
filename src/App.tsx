
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import Index from "./pages/Index";
import Produtos from "./pages/Produtos";
import Relatorios from "./pages/Relatorios";
import Pagamentos from "./pages/Pagamentos";
import Cancelamentos from "./pages/Cancelamentos";
import Estoque from "./pages/Estoque";
import Impressoes from "./pages/Impressoes";
import Terminais from "./pages/Terminais";
import ControleAcesso from "./pages/ControleAcesso";
import Vouchers from "./pages/Vouchers";
import RecargaPulseiras from "./pages/RecargaPulseiras";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Sistema de Totem - MariaPass</span>
                </div>
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/produtos" element={<Produtos />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route path="/pagamentos" element={<Pagamentos />} />
                  <Route path="/cancelamentos" element={<Cancelamentos />} />
                  <Route path="/estoque" element={<Estoque />} />
                  <Route path="/impressoes" element={<Impressoes />} />
                  <Route path="/terminais" element={<Terminais />} />
                  <Route path="/acesso" element={<ControleAcesso />} />
                  <Route path="/vouchers" element={<Vouchers />} />
                  <Route path="/recarga-pulseiras" element={<RecargaPulseiras />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
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

export default App;
