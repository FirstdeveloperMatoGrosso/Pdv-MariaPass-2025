
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Unlock,
  UserCheck,
  UserX,
  Shield,
  Key,
  Clock,
  Users,
  Search,
  Plus
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface AccessControl {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'manager' | 'viewer';
  status: 'active' | 'blocked' | 'suspended';
  lastLogin: string;
  loginAttempts: number;
  permissions: string[];
  createdAt: string;
}

interface AccessLog {
  id: string;
  username: string;
  action: string;
  timestamp: string;
  ip: string;
  success: boolean;
}

const ControleAcesso: React.FC = () => {
  const [users, setUsers] = useState<AccessControl[]>([
    {
      id: '1',
      username: 'admin',
      email: 'admin@mariapass.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-06-14 10:30:00',
      loginAttempts: 0,
      permissions: ['all'],
      createdAt: '2024-01-15 08:00:00'
    },
    {
      id: '2',
      username: 'operador01',
      email: 'operador01@mariapass.com',
      role: 'operator',
      status: 'active',
      lastLogin: '2024-06-14 09:15:30',
      loginAttempts: 1,
      permissions: ['products', 'sales'],
      createdAt: '2024-02-10 14:30:00'
    },
    {
      id: '3',
      username: 'supervisor',
      email: 'supervisor@mariapass.com',
      role: 'manager',
      status: 'blocked',
      lastLogin: '2024-06-13 17:45:15',
      loginAttempts: 5,
      permissions: ['products', 'sales', 'reports'],
      createdAt: '2024-03-05 11:20:00'
    }
  ]);

  const [accessLogs] = useState<AccessLog[]>([
    {
      id: '1',
      username: 'admin',
      action: 'Login realizado',
      timestamp: '2024-06-14 10:30:00',
      ip: '192.168.1.50',
      success: true
    },
    {
      id: '2',
      username: 'operador01',
      action: 'Tentativa de login',
      timestamp: '2024-06-14 09:15:30',
      ip: '192.168.1.51',
      success: false
    },
    {
      id: '3',
      username: 'supervisor',
      action: 'Conta bloqueada',
      timestamp: '2024-06-13 17:45:15',
      ip: '192.168.1.52',
      success: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'operator' as const,
    permissions: [] as string[]
  });

  const roles = ['admin', 'operator', 'manager', 'viewer'];
  const availablePermissions = ['products', 'sales', 'reports', 'users', 'settings', 'terminals'];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600"><UserCheck className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'blocked':
        return <Badge variant="destructive"><UserX className="w-3 h-3 mr-1" />Bloqueado</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-600"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'manager':
        return <Badge className="bg-blue-600"><Key className="w-3 h-3 mr-1" />Gerente</Badge>;
      case 'operator':
        return <Badge className="bg-green-600"><Users className="w-3 h-3 mr-1" />Operador</Badge>;
      case 'viewer':
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Visualizador</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        return { ...user, status: newStatus, loginAttempts: 0 };
      }
      return user;
    }));
    toast.success('Status do usuário atualizado!');
  };

  const resetLoginAttempts = (userId: string) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, loginAttempts: 0 } : user
    ));
    toast.success('Tentativas de login resetadas!');
  };

  const createUser = () => {
    if (!newUser.username || !newUser.email) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    const user: AccessControl = {
      id: Date.now().toString(),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
      lastLogin: 'Nunca',
      loginAttempts: 0,
      permissions: newUser.permissions,
      createdAt: new Date().toLocaleString('pt-BR')
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ username: '', email: '', role: 'operator', permissions: [] });
    toast.success('Usuário criado com sucesso!');
  };

  const activeUsers = users.filter(u => u.status === 'active').length;
  const blockedUsers = users.filter(u => u.status === 'blocked').length;
  const totalUsers = users.length;
  const failedLogins = accessLogs.filter(log => !log.success).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Controle de Acesso</h1>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Usuários Bloqueados</p>
                <p className="text-2xl font-bold text-red-600">{blockedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Logins Falharam</p>
                <p className="text-2xl font-bold text-orange-600">{failedLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criar Novo Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Criar Novo Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Nome de usuário"
              value={newUser.username}
              onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            />
            <select 
              value={newUser.role}
              onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
              className="border rounded-md px-3 py-2"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <Button onClick={createUser}>
              Criar Usuário
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por usuário ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">Todas as funções</option>
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm">{user.lastLogin}</TableCell>
                  <TableCell>
                    <Badge variant={user.loginAttempts > 3 ? "destructive" : "secondary"}>
                      {user.loginAttempts}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{user.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={user.status === 'active' ? "destructive" : "default"}
                        onClick={() => toggleUserStatus(user.id)}
                      >
                        {user.status === 'active' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </Button>
                      {user.loginAttempts > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetLoginAttempts(user.id)}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log de Acessos */}
      <Card>
        <CardHeader>
          <CardTitle>Log de Acessos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.username}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-sm">{log.timestamp}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {log.ip}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.success ? "default" : "destructive"}>
                      {log.success ? 'Sucesso' : 'Falhou'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ControleAcesso;
