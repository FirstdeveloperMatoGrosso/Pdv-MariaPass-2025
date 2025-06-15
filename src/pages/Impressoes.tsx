
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'imprimindo':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs"><Printer className="w-3 h-3 mr-1" />Imprimindo</Badge>;
      case 'concluido':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'falhou':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 text-xs"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
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
      <Badge variant="outline" className={`${colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700'} text-xs`}>
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
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-800">Carregando impressões</h3>
            <p className="text-sm text-gray-600">Aguarde enquanto buscamos os dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-1 sm:p-2 lg:p-3">
      <div className="max-w-full mx-auto space-y-3">
        {/* Header - Reduzido */}
        <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 bg-white p-3 lg:p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
              <Printer className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 truncate">Controle de Impressões</h1>
              <p className="text-xs lg:text-sm text-gray-600">Gerencie e monitore todas as impressões do sistema</p>
            </div>
          </div>
          <Button 
            onClick={testPrint} 
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 shadow-sm w-full lg:w-auto text-sm"
            disabled={testPrintMutation.isPending}
            size="sm"
          >
            <Printer className="w-4 h-4" />
            <span>Teste de Impressão</span>
          </Button>
        </div>

        {/* Estatísticas - Mais compactas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-1.5 sm:gap-2">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-blue-700 truncate">Total</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-900">{totalJobs}</p>
                </div>
                <div className="p-1.5 bg-blue-200 rounded-lg flex-shrink-0">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-green-700 truncate">Concluídas</p>
                  <p className="text-lg sm:text-xl font-bold text-green-900">{completedJobs}</p>
                </div>
                <div className="p-1.5 bg-green-200 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-red-700 truncate">Falharam</p>
                  <p className="text-lg sm:text-xl font-bold text-red-900">{failedJobs}</p>
                </div>
                <div className="p-1.5 bg-red-200 rounded-lg flex-shrink-0">
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-yellow-700 truncate">Pendentes</p>
                  <p className="text-lg sm:text-xl font-bold text-yellow-900">{pendingJobs}</p>
                </div>
                <div className="p-1.5 bg-yellow-200 rounded-lg flex-shrink-0">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm col-span-2 lg:col-span-1">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-purple-700 truncate">Taxa Sucesso</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-900">{successRate}%</p>
                </div>
                <div className="p-1.5 bg-purple-200 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros - Mais compactos */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm lg:text-base font-semibold text-gray-800">
              <Filter className="w-4 h-4 mr-2 text-gray-600" />
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por ID do pedido ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Impressora</label>
                <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                  <SelectTrigger className="h-9 border-gray-300 text-sm">
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-9 border-gray-300 text-sm">
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

        {/* Tabela de Impressões - Mais compacta */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base lg:text-lg font-semibold text-gray-800">
                Histórico de Impressões
              </CardTitle>
              <Badge variant="outline" className="text-xs px-2 py-1 w-fit">
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
                      <TableHead className="font-semibold text-gray-700 w-[150px] text-xs">ID / Pedido</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[100px] text-xs">Tipo</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[130px] text-xs">Impressora</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[100px] text-xs">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[140px] text-xs">Data/Hora</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[70px] text-center text-xs">Páginas</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[70px] text-center text-xs">Cópias</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[100px] text-xs">Usuário</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[100px] text-center text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job: any) => (
                      <TableRow key={job.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium py-2">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-gray-900 break-all text-xs">{job.pedido_id}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          {getTypeBadge(job.tipo)}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-xs text-gray-600 truncate" title={job.impressora}>{job.impressora}</div>
                        </TableCell>
                        <TableCell className="py-2">{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-xs text-gray-600 py-2">
                          {new Date(job.data_impressao).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge variant="outline" className="text-xs px-1">{job.paginas}</Badge>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge variant="outline" className="text-xs px-1">{job.copias}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 truncate py-2" title={job.usuario}>{job.usuario}</TableCell>
                        <TableCell className="text-center py-2">
                          {job.status === 'falhou' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryPrint(job.id)}
                              disabled={retryPrintMutation.isPending}
                              className="flex items-center space-x-1 h-7 px-2 border-red-200 text-red-700 hover:bg-red-50 text-xs"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span className="hidden xl:inline">Reimprimir</span>
                            </Button>
                          )}
                          {job.status !== 'falhou' && (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredJobs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6">
                          <div className="space-y-2">
                            <FileText className="w-6 h-6 text-gray-400 mx-auto" />
                            <p className="text-gray-500 text-sm">Nenhuma impressão encontrada</p>
                            <p className="text-xs text-gray-400">Tente ajustar os filtros de pesquisa</p>
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
