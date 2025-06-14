
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Wifi,
  WifiOff,
  Power,
  PowerOff,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Search
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Terminal {
  id: string;
  nome: string;
  localizacao: string;
  endereco_ip: string;
  status: string;
  ultima_conexao: string;
  versao: string;
  tempo_atividade: string;
  vendas_totais: number;
  vendas_hoje: number;
}

const Terminais: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Buscar terminais do Supabase
  const { data: terminals = [], isLoading, refetch } = useQuery({
    queryKey: ['terminais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terminais')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar terminais:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Mutation para atualizar status do terminal
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('terminais')
        .update({ 
          status, 
          ultima_conexao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminais'] });
      toast.success('Status do terminal atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  const filteredTerminals = terminals.filter((terminal: any) =>
    terminal.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    terminal.localizacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    terminal.endereco_ip.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Online</Badge>;
      case 'offline':
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" />Offline</Badge>;
      case 'manutencao':
        return <Badge className="bg-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Manutenção</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const updateTerminalStatus = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const restartTerminal = (id: string) => {
    const terminal = terminals.find((t: any) => t.id === id);
    if (terminal) {
      toast.success(`Reiniciando ${terminal.nome}...`);
      setTimeout(() => {
        updateTerminalStatus(id, 'online');
      }, 3000);
    }
  };

  const onlineTerminals = terminals.filter((t: any) => t.status === 'online').length;
  const offlineTerminals = terminals.filter((t: any) => t.status === 'offline').length;
  const maintenanceTerminals = terminals.filter((t: any) => t.status === 'manutencao').length;
  const totalSalesToday = terminals.reduce((acc: number, t: any) => acc + (t.vendas_hoje || 0), 0);

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando terminais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Monitor className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Controle de Terminais</h1>
        </div>
        <Button 
          className="flex items-center space-x-2 w-full sm:w-auto"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar Status</span>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Online</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{onlineTerminals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-red-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Offline</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{offlineTerminals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Manutenção</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{maintenanceTerminals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Vendas Hoje</p>
                <p className="text-lg sm:text-2xl font-bold">{totalSalesToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {offlineTerminals > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-red-700 flex items-center text-lg">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Terminais Offline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-2">
              {terminals.filter((t: any) => t.status === 'offline').map((terminal: any) => (
                <div key={terminal.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-white rounded border gap-2">
                  <span className="font-medium">{terminal.nome} - {terminal.localizacao}</span>
                  <Badge variant="destructive">
                    Offline desde {new Date(terminal.ultima_conexao).toLocaleString('pt-BR')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, localização ou IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Terminais */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Terminais Cadastrados ({filteredTerminals.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Terminal</TableHead>
                  <TableHead className="hidden sm:table-cell">Localização</TableHead>
                  <TableHead className="hidden md:table-cell">IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Última Conexão</TableHead>
                  <TableHead className="hidden md:table-cell">Versão</TableHead>
                  <TableHead className="hidden lg:table-cell">Uptime</TableHead>
                  <TableHead className="hidden sm:table-cell">Vendas Hoje</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerminals.map((terminal: any) => (
                  <TableRow key={terminal.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{terminal.nome}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {terminal.localizacao}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{terminal.localizacao}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {terminal.endereco_ip}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(terminal.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {new Date(terminal.ultima_conexao).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">v{terminal.versao}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{terminal.tempo_atividade}</TableCell>
                    <TableCell className="hidden sm:table-cell font-semibold">{terminal.vendas_hoje}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {terminal.status === 'offline' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                            onClick={() => updateTerminalStatus(terminal.id, 'online')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Power className="w-3 h-3" />
                          </Button>
                        )}
                        {terminal.status === 'online' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restartTerminal(terminal.id)}
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTerminalStatus(terminal.id, 'manutencao')}
                          className="h-8 w-8 p-0"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terminais;
