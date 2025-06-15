
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
      <div className="p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-green-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Controle de Acesso</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <CriarUsuarioModal />
          <Button 
            onClick={() => {
              refetch();
              refetchUsuarios();
            }}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Activity className="w-4 h-4" />
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Total de Logs</p>
                    <p className="text-lg sm:text-2xl font-bold">{totalLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Sucessos</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{successfulLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Falhas</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600">{failedLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Usuários Únicos</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">{uniqueUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por usuário, recurso ou IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2 flex-1">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select 
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="border rounded-md px-3 py-2 w-full"
                    >
                      <option value="all">Todas as ações</option>
                      {actions.map(action => (
                        <option key={action} value={action}>{getActionLabel(action)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    <select 
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="border rounded-md px-3 py-2 w-full"
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
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Logs de Acesso ({filteredLogs.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Usuário</TableHead>
                      <TableHead className="hidden sm:table-cell">Ação</TableHead>
                      <TableHead className="hidden md:table-cell">Recurso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">IP</TableHead>
                      <TableHead className="hidden lg:table-cell">Data/Hora</TableHead>
                      <TableHead className="hidden md:table-cell">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log: AccessLog) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{log.usuario}</div>
                            <div className="text-xs text-gray-500 sm:hidden">
                              {getActionLabel(log.acao)} - {log.recurso}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{getActionLabel(log.acao)}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{log.recurso}</TableCell>
                        <TableCell>{getStatusBadge(log.sucesso)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {log.ip_address}
                          </code>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {log.detalhes && (
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Total Usuários</p>
                    <p className="text-lg sm:text-2xl font-bold">{usuarios.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Usuários Ativos</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">
                      {usuarios.filter(u => u.ativo).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Administradores</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600">
                      {usuarios.filter(u => u.tipo_acesso === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Operadores</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">
                      {usuarios.filter(u => u.tipo_acesso === 'operador').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Usuários */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Usuários do Sistema ({usuarios.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Nome</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Tipo de Acesso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Último Login</TableHead>
                      <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario: Usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{usuario.nome}</div>
                            <div className="text-xs text-gray-500 sm:hidden">{usuario.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{usuario.email}</TableCell>
                        <TableCell>{getTipoAcessoBadge(usuario.tipo_acesso)}</TableCell>
                        <TableCell>
                          {usuario.ativo ? (
                            <Badge className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {usuario.ultimo_login 
                            ? new Date(usuario.ultimo_login).toLocaleString('pt-BR')
                            : 'Nunca'
                          }
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
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
