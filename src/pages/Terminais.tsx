
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
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs"><CheckCircle className="w-2 h-2 mr-1" />Online</Badge>;
      case 'offline':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 text-xs"><WifiOff className="w-2 h-2 mr-1" />Offline</Badge>;
      case 'manutencao':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs"><AlertTriangle className="w-2 h-2 mr-1" />Manutenção</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-800">Carregando terminais</h3>
            <p className="text-sm text-gray-600">Aguarde enquanto buscamos os dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="p-3 sm:p-4 lg:p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Monitor className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Controle de Terminais</h1>
              <p className="text-sm text-gray-600 mt-0.5">Monitore e gerencie todos os terminais da rede</p>
            </div>
          </div>
          <Button 
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 shadow-sm text-sm"
            onClick={() => refetch()}
            size="sm"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Atualizar Status</span>
          </Button>
        </div>

        {/* Estatísticas Compactas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-green-700">Online</p>
                  <p className="text-lg font-bold text-green-900">{onlineTerminals}</p>
                </div>
                <div className="p-1.5 bg-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-red-700">Offline</p>
                  <p className="text-lg font-bold text-red-900">{offlineTerminals}</p>
                </div>
                <div className="p-1.5 bg-red-200 rounded-lg">
                  <WifiOff className="w-4 h-4 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-yellow-700">Manutenção</p>
                  <p className="text-lg font-bold text-yellow-900">{maintenanceTerminals}</p>
                </div>
                <div className="p-1.5 bg-yellow-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-blue-700">Vendas Hoje</p>
                  <p className="text-lg font-bold text-blue-900">{totalSalesToday}</p>
                </div>
                <div className="p-1.5 bg-blue-200 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-purple-700">Uptime</p>
                  <p className="text-lg font-bold text-purple-900">{uptime}%</p>
                </div>
                <div className="p-1.5 bg-purple-200 rounded-lg">
                  <Activity className="w-4 h-4 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas Compactos */}
        {offlineTerminals > 0 && (
          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-800 flex items-center text-base">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Atenção: {offlineTerminals} {offlineTerminals === 1 ? 'Terminal Offline' : 'Terminais Offline'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {terminals.filter((t: any) => t.status === 'offline').map((terminal: any) => (
                <div key={terminal.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white rounded-lg border border-red-100 shadow-sm gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <Monitor className="w-3 h-3 text-red-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-sm">{terminal.nome}</span>
                      <div className="flex items-center text-xs text-gray-600 mt-0.5">
                        <MapPin className="w-2 h-2 mr-1" />
                        {terminal.localizacao}
                      </div>
                    </div>
                  </div>
                  <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 text-xs">
                    Offline desde {new Date(terminal.ultima_conexao).toLocaleString('pt-BR')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Filtros Compactos */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold text-gray-800">
              <Filter className="w-4 h-4 mr-2 text-gray-600" />
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input
                placeholder="Buscar por nome, localização ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Terminais Compacta */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Terminais Cadastrados
              </CardTitle>
              <Badge variant="outline" className="text-xs px-2 py-1">
                {filteredTerminals.length} {filteredTerminals.length === 1 ? 'terminal' : 'terminais'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 min-w-[120px] text-xs h-10">Terminal</TableHead>
                    <TableHead className="font-semibold text-gray-700 hidden sm:table-cell text-xs h-10">Localização</TableHead>
                    <TableHead className="font-semibold text-gray-700 hidden md:table-cell text-xs h-10">IP</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-xs h-10">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 hidden lg:table-cell text-xs h-10">Última Conexão</TableHead>
                    <TableHead className="font-semibold text-gray-700 hidden md:table-cell text-xs h-10">Versão</TableHead>
                    <TableHead className="font-semibold text-gray-700 hidden lg:table-cell text-xs h-10">Uptime</TableHead>
                    <TableHead className="font-semibold text-gray-700 hidden sm:table-cell text-center text-xs h-10">Vendas Hoje</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center text-xs h-10">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerminals.map((terminal: any) => (
                    <TableRow key={terminal.id} className="hover:bg-gray-50 transition-colors h-12">
                      <TableCell className="font-medium py-2">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-gray-900 text-sm">{terminal.nome}</div>
                          <div className="text-xs text-gray-500 sm:hidden flex items-center">
                            <MapPin className="w-2 h-2 mr-1" />
                            {terminal.localizacao}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-2">
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="w-2 h-2 mr-1 text-gray-400" />
                          {terminal.localizacao}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono border">
                          {terminal.endereco_ip}
                        </code>
                      </TableCell>
                      <TableCell className="py-2">{getStatusBadge(terminal.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-gray-600 py-2">
                        {new Date(terminal.ultima_conexao).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0.5">
                          v{terminal.versao}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-gray-600 py-2">{terminal.tempo_atividade}</TableCell>
                      <TableCell className="hidden sm:table-cell text-center py-2">
                        <Badge variant="outline" className="font-semibold text-green-700 bg-green-50 border-green-200 text-xs px-1.5 py-0.5">
                          {terminal.vendas_hoje}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {terminal.status === 'offline' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 h-6 w-6 p-0"
                              onClick={() => updateTerminalStatus(terminal.id, 'online')}
                              disabled={updateStatusMutation.isPending}
                              title="Ativar terminal"
                            >
                              <Power className="w-2.5 h-2.5" />
                            </Button>
                          )}
                          {terminal.status === 'online' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restartTerminal(terminal.id)}
                              className="h-6 w-6 p-0 border-blue-200 text-blue-700 hover:bg-blue-50"
                              title="Reiniciar terminal"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTerminalStatus(terminal.id, 'manutencao')}
                            className="h-6 w-6 p-0 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                            title="Colocar em manutenção"
                          >
                            <Settings className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTerminals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6">
                        <div className="space-y-2">
                          <Monitor className="w-6 h-6 text-gray-400 mx-auto" />
                          <p className="text-gray-500 text-sm">Nenhum terminal encontrado</p>
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
    </div>
  );
};

export default Terminais;
