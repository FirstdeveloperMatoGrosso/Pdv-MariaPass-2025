
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
  Search,
  Activity,
  MapPin,
  TrendingUp,
  Filter
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
      toast.success('Status do terminal atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do terminal');
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
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-1 py-0"><CheckCircle className="w-2 h-2 mr-1" />Online</Badge>;
      case 'offline':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 text-xs px-1 py-0"><WifiOff className="w-2 h-2 mr-1" />Offline</Badge>;
      case 'manutencao':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-1 py-0"><AlertTriangle className="w-2 h-2 mr-1" />Manutenção</Badge>;
      default:
        return <Badge variant="outline" className="text-xs px-1 py-0">{status}</Badge>;
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
  const uptime = terminals.length > 0 ? ((onlineTerminals / terminals.length) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <div className="p-2 sm:p-3 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando terminais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <Monitor className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Controle de Terminais</h1>
        </div>
        <Button 
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 h-8 text-sm px-3"
          onClick={() => refetch()}
          size="sm"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Atualizar Status</span>
        </Button>
      </div>

      {/* Estatísticas Compactas */}
      <div className="grid grid-cols-5 gap-2">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-green-700">Online</p>
                <p className="text-base font-bold text-green-900">{onlineTerminals}</p>
              </div>
              <div className="p-1 bg-green-200 rounded">
                <CheckCircle className="w-3 h-3 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-red-700">Offline</p>
                <p className="text-base font-bold text-red-900">{offlineTerminals}</p>
              </div>
              <div className="p-1 bg-red-200 rounded">
                <WifiOff className="w-3 h-3 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-yellow-700">Manutenção</p>
                <p className="text-base font-bold text-yellow-900">{maintenanceTerminals}</p>
              </div>
              <div className="p-1 bg-yellow-200 rounded">
                <AlertTriangle className="w-3 h-3 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-blue-700">Vendas Hoje</p>
                <p className="text-base font-bold text-blue-900">{totalSalesToday}</p>
              </div>
              <div className="p-1 bg-blue-200 rounded">
                <TrendingUp className="w-3 h-3 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-purple-700">Uptime</p>
                <p className="text-base font-bold text-purple-900">{uptime}%</p>
              </div>
              <div className="p-1 bg-purple-200 rounded">
                <Activity className="w-3 h-3 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Compactos */}
      {offlineTerminals > 0 && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
          <CardHeader className="pb-1 p-2 sm:p-3">
            <CardTitle className="text-red-800 flex items-center text-sm">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Atenção: {offlineTerminals} {offlineTerminals === 1 ? 'Terminal Offline' : 'Terminais Offline'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 p-2 sm:p-3">
            {terminals.filter((t: any) => t.status === 'offline').map((terminal: any) => (
              <div key={terminal.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-white rounded border border-red-100 gap-1">
                <div className="flex items-center space-x-1">
                  <div className="p-1 bg-red-100 rounded">
                    <Monitor className="w-2 h-2 text-red-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-xs">{terminal.nome}</span>
                    <div className="flex items-center text-xs text-gray-600">
                      <MapPin className="w-2 h-2 mr-0.5" />
                      {terminal.localizacao}
                    </div>
                  </div>
                </div>
                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 text-xs px-1 py-0">
                  Offline desde {new Date(terminal.ultima_conexao).toLocaleString('pt-BR')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros Compactos */}
      <Card>
        <CardHeader className="pb-1 p-2 sm:p-3">
          <CardTitle className="flex items-center text-sm font-semibold text-gray-800">
            <Filter className="w-3 h-3 mr-1 text-gray-600" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-2 sm:p-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="Buscar por nome, localização ou IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Terminais Compacta */}
      <Card>
        <CardHeader className="pb-1 p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800">
              Terminais Cadastrados
            </CardTitle>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {filteredTerminals.length} {filteredTerminals.length === 1 ? 'terminal' : 'terminais'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 min-w-[100px] text-xs h-7">Terminal</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden sm:table-cell text-xs h-7">Localização</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden md:table-cell text-xs h-7">IP</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-xs h-7">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden lg:table-cell text-xs h-7">Última Conexão</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden md:table-cell text-xs h-7">Versão</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden lg:table-cell text-xs h-7">Uptime</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden sm:table-cell text-center text-xs h-7">Vendas Hoje</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center text-xs h-7">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerminals.map((terminal: any) => (
                  <TableRow key={terminal.id} className="hover:bg-gray-50 transition-colors h-8">
                    <TableCell className="font-medium py-1 p-2">
                      <div className="space-y-0">
                        <div className="font-semibold text-gray-900 text-xs">{terminal.nome}</div>
                        <div className="text-xs text-gray-500 sm:hidden flex items-center">
                          <MapPin className="w-2 h-2 mr-0.5" />
                          {terminal.localizacao}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-1 p-2">
                      <div className="flex items-center text-xs text-gray-600">
                        <MapPin className="w-2 h-2 mr-0.5 text-gray-400" />
                        {terminal.localizacao}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-1 p-2">
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono border">
                        {terminal.endereco_ip}
                      </code>
                    </TableCell>
                    <TableCell className="py-1 p-2">{getStatusBadge(terminal.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-gray-600 py-1 p-2">
                      {new Date(terminal.ultima_conexao).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-1 p-2">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-1 py-0">
                        v{terminal.versao}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-gray-600 py-1 p-2">{terminal.tempo_atividade}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center py-1 p-2">
                      <Badge variant="outline" className="font-semibold text-green-700 bg-green-50 border-green-200 text-xs px-1 py-0">
                        {terminal.vendas_hoje}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1 p-2">
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {terminal.status === 'offline' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-5 w-5 p-0"
                            onClick={() => updateTerminalStatus(terminal.id, 'online')}
                            disabled={updateStatusMutation.isPending}
                            title="Ativar terminal"
                          >
                            <Power className="w-2 h-2" />
                          </Button>
                        )}
                        {terminal.status === 'online' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restartTerminal(terminal.id)}
                            className="h-5 w-5 p-0 border-blue-200 text-blue-700 hover:bg-blue-50"
                            title="Reiniciar terminal"
                          >
                            <RefreshCw className="w-2 h-2" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTerminalStatus(terminal.id, 'manutencao')}
                          className="h-5 w-5 p-0 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                          title="Colocar em manutenção"
                        >
                          <Settings className="w-2 h-2" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTerminals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      <div className="space-y-1">
                        <Monitor className="w-5 h-5 text-gray-400 mx-auto" />
                        <p className="text-gray-500 text-xs">Nenhum terminal encontrado</p>
                        <p className="text-xs text-gray-400">Tente ajustar os filtros de pesquisa</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terminais;
