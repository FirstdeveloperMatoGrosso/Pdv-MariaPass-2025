
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import CriarUsuarioModal from '@/components/CriarUsuarioModal';

interface AccessLog {
  id: string;
  usuario: string;
  acao: string;
  recurso: string;
  ip_address: string;
  user_agent: string;
  sucesso: boolean;
  detalhes: any;
  created_at: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo_acesso: string;
  ativo: boolean;
  ultimo_login: string;
  created_at: string;
}

const ControleAcesso: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' ou 'usuarios'

  // Buscar logs de acesso do Supabase
  const { data: accessLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['controle_acesso'],
    queryFn: async (): Promise<AccessLog[]> => {
      const { data, error } = await supabase
        .from('controle_acesso')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar logs de acesso:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  const actions = ['login', 'logout', 'visualizar', 'editar', 'criar', 'deletar'];

  const filteredLogs = accessLogs.filter((log: AccessLog) => {
    const matchesSearch = log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.recurso.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ip_address?.includes(searchTerm);
    const matchesAction = selectedAction === 'all' || log.acao === selectedAction;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'sucesso' && log.sucesso) ||
                         (selectedStatus === 'falha' && !log.sucesso);
    return matchesSearch && matchesAction && matchesStatus;
  });

  const getStatusBadge = (sucesso: boolean) => {
    return sucesso ? (
      <Badge className="bg-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        Sucesso
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Falha
      </Badge>
    );
  };

  const getActionLabel = (acao: string) => {
    const actionLabels: { [key: string]: string } = {
      'login': 'Login',
      'logout': 'Logout',
      'visualizar': 'Visualizar',
      'editar': 'Editar',
      'criar': 'Criar',
      'deletar': 'Deletar'
    };
    return actionLabels[acao] || acao;
  };

  const totalLogs = accessLogs.length;
  const successfulLogs = accessLogs.filter((log: AccessLog) => log.sucesso).length;
  const failedLogs = accessLogs.filter((log: AccessLog) => !log.sucesso).length;
  const uniqueUsers = new Set(accessLogs.map((log: AccessLog) => log.usuario)).size;

  // Buscar usuários do sistema
  const { data: usuarios = [], isLoading: isLoadingUsuarios, refetch: refetchUsuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async (): Promise<Usuario[]> => {
      const { data, error } = await (supabase as any)
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  const getTipoAcessoBadge = (tipo: string) => {
    const cores = {
      admin: 'bg-red-600',
      gerente: 'bg-blue-600', 
      operador: 'bg-green-600',
      visualizador: 'bg-gray-600'
    };
    
    const labels = {
      admin: 'Administrador',
      gerente: 'Gerente',
      operador: 'Operador', 
      visualizador: 'Visualizador'
    };

    return (
      <Badge className={cores[tipo as keyof typeof cores] || 'bg-gray-600'}>
        {labels[tipo as keyof typeof labels] || tipo}
      </Badge>
    );
  };

  if (isLoading || isLoadingUsuarios) {
    return (
      <div className="p-2 sm:p-3 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <Shield className="w-5 h-5 text-green-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Controle de Acesso</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <CriarUsuarioModal />
          <Button 
            onClick={() => {
              refetch();
              refetchUsuarios();
            }}
            variant="outline"
            className="flex items-center space-x-1 h-8 text-sm px-3"
          >
            <Activity className="w-3 h-3" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Logs de Acesso
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'usuarios'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Usuários do Sistema
        </button>
      </div>

      {activeTab === 'logs' && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Card>
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Total de Logs</p>
                    <p className="text-lg sm:text-xl font-bold">{totalLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Sucessos</p>
                    <p className="text-lg sm:text-xl font-bold text-green-600">{successfulLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center space-x-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Falhas</p>
                    <p className="text-lg sm:text-xl font-bold text-red-600">{failedLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-purple-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Usuários Únicos</p>
                    <p className="text-lg sm:text-xl font-bold text-purple-600">{uniqueUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    placeholder="Buscar por usuário, recurso ou IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center space-x-1 flex-1">
                    <Filter className="w-3 h-3 text-gray-500" />
                    <select 
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="border rounded-md px-2 py-1 w-full text-sm"
                    >
                      <option value="all">Todas as ações</option>
                      {actions.map(action => (
                        <option key={action} value={action}>{getActionLabel(action)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-1 flex-1">
                    <AlertTriangle className="w-3 h-3 text-gray-500" />
                    <select 
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="border rounded-md px-2 py-1 w-full text-sm"
                    >
                      <option value="all">Todos os status</option>
                      <option value="sucesso">Sucesso</option>
                      <option value="falha">Falha</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Logs */}
          <Card>
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-sm sm:text-base">Logs de Acesso ({filteredLogs.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px] h-8 text-xs">Usuário</TableHead>
                      <TableHead className="hidden sm:table-cell h-8 text-xs">Ação</TableHead>
                      <TableHead className="hidden md:table-cell h-8 text-xs">Recurso</TableHead>
                      <TableHead className="h-8 text-xs">Status</TableHead>
                      <TableHead className="hidden lg:table-cell h-8 text-xs">IP</TableHead>
                      <TableHead className="hidden lg:table-cell h-8 text-xs">Data/Hora</TableHead>
                      <TableHead className="hidden md:table-cell h-8 text-xs">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log: AccessLog) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium p-2">
                          <div>
                            <div className="font-semibold text-xs">{log.usuario}</div>
                            <div className="text-xs text-gray-500 sm:hidden">
                              {getActionLabel(log.acao)} - {log.recurso}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell p-2">
                          <Badge variant="outline" className="text-xs">{getActionLabel(log.acao)}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell p-2 text-xs">{log.recurso}</TableCell>
                        <TableCell className="p-2">{getStatusBadge(log.sucesso)}</TableCell>
                        <TableCell className="hidden lg:table-cell p-2">
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                            {log.ip_address}
                          </code>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs p-2">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="hidden md:table-cell p-2">
                          {log.detalhes && (
                            <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'usuarios' && (
        <>
          {/* Estatísticas dos Usuários */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Card>
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Total Usuários</p>
                    <p className="text-lg sm:text-xl font-bold">{usuarios.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Usuários Ativos</p>
                    <p className="text-lg sm:text-xl font-bold text-green-600">
                      {usuarios.filter(u => u.ativo).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4 text-red-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Administradores</p>
                    <p className="text-lg sm:text-xl font-bold text-red-600">
                      {usuarios.filter(u => u.tipo_acesso === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Operadores</p>
                    <p className="text-lg sm:text-xl font-bold text-purple-600">
                      {usuarios.filter(u => u.tipo_acesso === 'operador').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Usuários */}
          <Card>
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-sm sm:text-base">Usuários do Sistema ({usuarios.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px] h-8 text-xs">Nome</TableHead>
                      <TableHead className="hidden sm:table-cell h-8 text-xs">Email</TableHead>
                      <TableHead className="h-8 text-xs">Tipo de Acesso</TableHead>
                      <TableHead className="h-8 text-xs">Status</TableHead>
                      <TableHead className="hidden lg:table-cell h-8 text-xs">Último Login</TableHead>
                      <TableHead className="hidden lg:table-cell h-8 text-xs">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario: Usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium p-2">
                          <div>
                            <div className="font-semibold text-xs">{usuario.nome}</div>
                            <div className="text-xs text-gray-500 sm:hidden">{usuario.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell p-2 text-xs">{usuario.email}</TableCell>
                        <TableCell className="p-2">{getTipoAcessoBadge(usuario.tipo_acesso)}</TableCell>
                        <TableCell className="p-2">
                          {usuario.ativo ? (
                            <Badge className="bg-green-600 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs p-2">
                          {usuario.ultimo_login 
                            ? new Date(usuario.ultimo_login).toLocaleString('pt-BR')
                            : 'Nunca'
                          }
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs p-2">
                          {new Date(usuario.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ControleAcesso;
