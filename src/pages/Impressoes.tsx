import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Search,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Filter,
  TrendingUp
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PrintJob {
  id: string;
  pedido_id: string;
  tipo: string;
  impressora: string;
  status: string;
  data_impressao: string;
  paginas: number;
  copias: number;
  usuario: string;
}

const Impressoes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const queryClient = useQueryClient();

  const printers = ['Impressora Principal', 'Impressora Vouchers', 'Impressora Backup'];

  // Buscar impressões do Supabase
  const { data: printJobs = [], isLoading } = useQuery({
    queryKey: ['impressoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('impressoes')
        .select('*')
        .order('data_impressao', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar impressões:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Mutation para reenviar impressão
  const retryPrintMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('impressoes')
        .update({ status: 'pendente' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impressoes'] });
      toast.success('Reimpressão solicitada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao reenviar impressão:', error);
      toast.error('Erro ao solicitar reimpressão');
    },
  });

  // Mutation para teste de impressão
  const testPrintMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('impressoes')
        .insert({
          pedido_id: 'TEST-' + Date.now(),
          tipo: 'comprovante',
          impressora: 'Impressora Principal',
          status: 'pendente',
          paginas: 1,
          copias: 1,
          usuario: 'Admin'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impressoes'] });
      toast.success('Teste de impressão enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao enviar teste:', error);
      toast.error('Erro ao enviar teste de impressão');
    },
  });

  const filteredJobs = printJobs.filter((job: any) => {
    const matchesSearch = job.pedido_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.usuario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrinter = selectedPrinter === 'all' || job.impressora === selectedPrinter;
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
    return matchesSearch && matchesPrinter && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'imprimindo':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Printer className="w-3 h-3 mr-1" />Imprimindo</Badge>;
      case 'concluido':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'falhou':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comprovante': return 'Comprovante';
      case 'voucher': return 'Voucher';
      case 'relatorio': return 'Relatório';
      case 'ticket': return 'Ticket';
      default: return type;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      comprovante: 'bg-blue-50 text-blue-700 border-blue-200',
      voucher: 'bg-purple-50 text-purple-700 border-purple-200',
      relatorio: 'bg-orange-50 text-orange-700 border-orange-200',
      ticket: 'bg-green-50 text-green-700 border-green-200'
    };
    
    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700'}>
        {getTypeLabel(type)}
      </Badge>
    );
  };

  const retryPrint = (jobId: string) => {
    retryPrintMutation.mutate(jobId);
  };

  const testPrint = () => {
    testPrintMutation.mutate();
  };

  const totalJobs = printJobs.length;
  const completedJobs = printJobs.filter((j: any) => j.status === 'concluido').length;
  const failedJobs = printJobs.filter((j: any) => j.status === 'falhou').length;
  const pendingJobs = printJobs.filter((j: any) => j.status === 'pendente').length;
  const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Carregando impressões</h3>
            <p className="text-gray-600">Aguarde enquanto buscamos os dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-full mx-auto space-y-4 lg:space-y-6">
        {/* Header - Ajustado para melhor responsividade */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Printer className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">Controle de Impressões</h1>
              <p className="text-sm lg:text-base text-gray-600 mt-1">Gerencie e monitore todas as impressões do sistema</p>
            </div>
          </div>
          <Button 
            onClick={testPrint} 
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 shadow-sm w-full lg:w-auto"
            disabled={testPrintMutation.isPending}
            size="lg"
          >
            <Printer className="w-4 h-4" />
            <span>Teste de Impressão</span>
          </Button>
        </div>

        {/* Estatísticas - Grid responsivo melhorado */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 truncate">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-900">{totalJobs}</p>
                </div>
                <div className="p-2 bg-blue-200 rounded-lg flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 truncate">Concluídas</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-900">{completedJobs}</p>
                </div>
                <div className="p-2 bg-green-200 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 truncate">Falharam</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-900">{failedJobs}</p>
                </div>
                <div className="p-2 bg-red-200 rounded-lg flex-shrink-0">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-yellow-700 truncate">Pendentes</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-900">{pendingJobs}</p>
                </div>
                <div className="p-2 bg-yellow-200 rounded-lg flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm col-span-2 lg:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 truncate">Taxa Sucesso</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-900">{successRate}%</p>
                </div>
                <div className="p-2 bg-purple-200 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros - Layout melhorado */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-base lg:text-lg font-semibold text-gray-800">
              <Filter className="w-5 h-5 mr-2 text-gray-600" />
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por ID do pedido ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Impressora</label>
                <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                  <SelectTrigger className="h-11 border-gray-300">
                    <SelectValue placeholder="Todas as impressoras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as impressoras</SelectItem>
                    {printers.map(printer => (
                      <SelectItem key={printer} value={printer}>{printer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-11 border-gray-300">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="imprimindo">Imprimindo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="falhou">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Impressões - Container com scroll horizontal */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800">
                Histórico de Impressões
              </CardTitle>
              <Badge variant="outline" className="text-sm px-3 py-1 w-fit">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'resultado' : 'resultados'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-w-full">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700 w-[180px]">ID / Pedido</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[120px]">Tipo</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[150px]">Impressora</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[120px]">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[160px]">Data/Hora</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[80px] text-center">Páginas</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[80px] text-center">Cópias</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[120px]">Usuário</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[120px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job: any) => (
                      <TableRow key={job.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 break-all">{job.pedido_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(job.tipo)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 truncate" title={job.impressora}>{job.impressora}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(job.data_impressao).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">{job.paginas}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">{job.copias}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 truncate" title={job.usuario}>{job.usuario}</TableCell>
                        <TableCell className="text-center">
                          {job.status === 'falhou' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryPrint(job.id)}
                              disabled={retryPrintMutation.isPending}
                              className="flex items-center space-x-1 h-8 px-3 border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span className="hidden xl:inline">Reimprimir</span>
                            </Button>
                          )}
                          {job.status !== 'falhou' && (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredJobs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="space-y-2">
                            <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                            <p className="text-gray-500">Nenhuma impressão encontrada</p>
                            <p className="text-sm text-gray-400">Tente ajustar os filtros de pesquisa</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Impressoes;
