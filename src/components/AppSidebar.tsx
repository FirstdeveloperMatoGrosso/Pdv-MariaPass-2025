import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar 
} from '@/components/ui/sidebar';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  ScanBarcode, 
  Package,
  BarChart3,
  CreditCard,
  XCircle,
  Archive,
  Printer,
  Monitor,
  Lock,
  Ticket,
  Watch
} from 'lucide-react';

const menuItems = [
  { title: 'Início', url: '/', icon: Home },
  { title: 'Produtos', url: '/produtos', icon: Package },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Pagamentos', url: '/pagamentos', icon: CreditCard },
  { title: 'Cancelamentos', url: '/cancelamentos', icon: XCircle },
  { title: 'Estoque', url: '/estoque', icon: Archive },
  { title: 'Impressões', url: '/impressoes', icon: Printer },
  { title: 'Terminais', url: '/terminais', icon: Monitor },
  { title: 'Controle de Acesso', url: '/acesso', icon: Lock },
  { title: 'Vouchers', url: '/vouchers', icon: Ticket },
  { title: 'Recarga Pulseiras', url: '/recarga-pulseiras', icon: Watch },
  { title: 'Scanner & Configurações', url: '/configuracoes', icon: ScanBarcode },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
          <ScanBarcode className="w-6 h-6 text-green-600" />
          {!isCollapsed && (
            <span className="font-bold text-lg text-green-600">MariaPass</span>
          )}
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-2"
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
