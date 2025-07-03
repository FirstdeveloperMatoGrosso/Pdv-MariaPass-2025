import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  useSidebar 
} from '@/components/ui/sidebar';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package,
  BarChart3,
  CreditCard,
  XCircle,
  Archive,
  Printer,
  Monitor,
  Lock,
  FileSpreadsheet,
  ShoppingCart,
  FileText,
  FileCheck2,
  Banknote,
  ScanBarcode,
  Users
} from 'lucide-react';

// Adicionando as integrações requisitadas
const menuItems = [
  { title: 'Início', url: '/', icon: Home, color: '#3b82f6' }, // Azul
  { title: 'Vendas', url: '/vendas', icon: ShoppingCart, color: '#10b981' }, // Verde
  { title: 'Clientes', url: '/clientes', icon: Users, color: '#8b5cf6' }, // Roxo
  { title: 'Produtos', url: '/produtos', icon: Package, color: '#eab308' }, // Amarelo
  { title: 'Importar Excel', url: '/importar-excel', icon: FileSpreadsheet, color: '#10b981' }, // Esmeralda
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3, color: '#a855f7' }, // Roxo
  { title: 'Cancelamentos', url: '/cancelamentos', icon: XCircle, color: '#ef4444' }, // Vermelho
  { title: 'Estoque', url: '/estoque', icon: Archive, color: '#f59e0b' }, // Âmbar
  { title: 'Impressões de Vendas', url: '/impressoes', icon: Printer, color: '#06b6d4' }, // Ciano
  { title: 'Terminais', url: '/terminais', icon: Monitor, color: '#0ea5e9' }, // Azul céu
  { title: 'Controle de Acesso', url: '/acesso', icon: Lock, color: '#f43f5e' }, // Rosa
  { title: 'Scanner & Configurações', url: '/configuracoes', icon: ScanBarcode, color: '#8b5cf6' }, // Violeta
  { title: 'Integração Nota Fiscal', url: '/integracao-nota-fiscal', icon: FileText, color: '#f97316' }, // Laranja
  { title: 'Integração Boleto', url: '/integracao-boleto', icon: Banknote, color: '#84cc16' }, // Lima
  { title: 'Integração NFC-e', url: '/integracao-nfce', icon: FileCheck2, color: '#0d9488' }, // Verde água
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === 'collapsed';

  console.log('Current path:', currentPath);
  console.log('Sidebar state:', state);
  console.log('Menu items:', menuItems);

  return (
    <Sidebar 
      className={`fixed left-0 top-0 bottom-0 flex flex-col border-r border-gray-200 ${isCollapsed ? 'w-14' : 'w-56'}`} 
      collapsible="icon"
      data-sidebar="sidebar"
      data-collapsed={isCollapsed ? 'true' : 'false'}
      style={{
        height: '100vh',
        padding: '0.25rem 0 0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        zIndex: 40,
        transition: 'width 0.2s ease-in-out'
      }}
    >
      <div className="flex-shrink-0 bg-green-700 rounded-tr-lg">
        <SidebarHeader className="border-b border-green-800 p-1.5 h-12 bg-green-700 rounded-tr-lg pt-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} h-full`}>
            <img 
              src="/file_00000000752461f89c07fa2b32ca50d32.png" 
              alt="Logo MariaPass" 
              className="h-9 w-auto max-w-[32px] transition-all duration-300 drop-shadow-md"
            />
            {!isCollapsed && (
              <div className="flex items-center ml-2">
                <span className="font-bold text-lg text-pink-400">Maria</span>
                <span className="font-bold text-lg text-blue-500">Pass</span>
              </div>
            )}
          </div>
        </SidebarHeader>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarContent className="px-1.5 pt-1">
          <SidebarMenu className="space-y-0">
            {menuItems.map((item, index) => (
              <SidebarMenuItem key={index} className="w-full">
                <SidebarMenuButton asChild className="w-full h-8" data-active={isActive(item.url)}>
                  <NavLink
                    to={item.url}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} w-full h-full px-2 rounded transition-colors hover:bg-green-50`}
                  >
                    <item.icon 
                      className="h-4 w-4 flex-shrink-0" 
                      style={{ color: item.color }}
                      aria-hidden="true"
                    />
                    {!isCollapsed && (
                      <span className="ml-2 text-xs font-medium whitespace-nowrap truncate">
                        {item.title}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
