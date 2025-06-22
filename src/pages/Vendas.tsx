
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Search,
  Calendar,
  Filter,
  Download,
  Eye,
  Image as ImageIcon,
  Package,
  CreditCard,
  Hash,
  MapPin
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface VendaRealizada {
  id: string;
  data_venda: string;
  numero_autorizacao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  forma_pagamento: string;
  produto_nome?: string;
  produto_imagem?: string;
  nsu?: string;
  bandeira?: string;
}

const Vendas: React.FC = () => {
  const [filtroData, setFiltroData] = useState('hoje');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState('todas');
  const [busca, setBusca] = useState('');
  const [selectedVenda, setSelectedVenda] = useState<VendaRealizada | null>(null);
  const { toast } = useToast();

  // Buscar vendas realizadas
  const { data: vendas = [], isLoading, error, refetch } = useQuery({
    queryKey: ['vendas-realizadas', filtroData, filtroFormaPagamento, busca],
    queryFn: async () => {
      console.log('Buscando vendas realizadas...');
      
      let dataInicio = new Date();
      let dataFim = new Date();
      
      // Configurar filtros de data
      switch (filtroData) {
        case 'hoje':
          dataInicio.setHours(0, 0, 0, 0);
          dataFim.setHours(23, 59, 59, 999);
          break;
        case 'semana':
          dataInicio.setDate(dataInicio.getDate() - 7);
          dataInicio.setHours(0, 0, 0, 0);
          dataFim.setHours(23, 59, 59, 999);
          break;
        case 'mes':
          dataInicio.setDate(1);
          dataInicio.setHours(0, 0, 0, 0);
          dataFim.setHours(23, 59, 59, 999);
          break;
        case 'todos':
          dataInicio = new Date('2020-01-01');
          dataFim.setHours(23, 59, 59, 999);
          break;
      }

      let query = supabase
        .from('vendas_pulseiras')
        .select(`
          id,
          data_venda,
          numero_autorizacao,
          quantidade,
          valor_unitario,
          valor_total,
          forma_pagamento,
          nsu,
          bandeira,
          produtos:produto_id (
            nome,
            imagem_url
          )
        `)
        .gte('data_venda', dataInicio.toISOString())
        .lte('data_venda', dataFim.toISOString())
        .order('data_venda', { ascending: false });

      // Filtrar por forma de pagamento
      if (filtroFormaPagamento !== 'todas') {
        query = query.eq('forma_pagamento', filtroFormaPagamento);
      }

      // Filtrar por busca (número de autorização ou nome do produto)
      if (busca.trim()) {
        query = query.or(`numero_autorizacao.ilike.%${busca}%,produtos.nome.ilike.%${busca}%`);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        throw error;
      }

      console.log('Vendas encontradas:', data?.length || 0);

      return data?.map(venda => ({
        id: venda.id,
        data_venda: venda.data_venda,
        numero_autorizacao: venda.numero_autorizacao || `VEN-${venda.id.slice(0, 8)}`,
        quantidade: Number(venda.quantidade) || 1,
        valor_unitario: Number(venda.valor_unitario) || 0,
        valor_total: Number(venda.valor_total) || 0,
        forma_pagamento: venda.forma_pagamento || 'Não informado',
        produto_nome: venda.produtos?.nome || 'Produto não identificado',
        produto_imagem: venda.produtos?.imagem_url,
        nsu: venda.nsu,
        bandeira: venda.bandeira
      })) || [];
    },
  });

  // Calcular totais
  const totalVendas = vendas.length;
  const faturamentoTotal = vendas.reduce((acc, venda) => acc + venda.valor_total, 0);
  const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getFormaPagamentoBadge = (forma: string) => {
    const cores = {
      'dinheiro': 'bg-green-100 text-green-800',
      'cartao_credito': 'bg-blue-100 text-blue-800',
      'cartao_debito': 'bg-purple-100 text-purple-800',
      'pix': 'bg-orange-100 text-orange-800',
      'pulseira': 'bg-pink-100 text-pink-800'
    };
    
    return cores[forma as keyof typeof cores] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentIcon = (forma: string) => {
    switch (forma.toLowerCase()) {
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'pix':
        return <Hash className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'pulseira':
        return <Package className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen p-2 sm:p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-red-600 mb-4 text-sm">Erro ao carregar vendas: {error.message}</p>
            <Button onClick={() => refetch()} size="sm">Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 space-y-2 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Vendas Realizadas</h1>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="text-xs sm:text-sm">Exportar</span>
        </Button>
      </div>

      {/* Resumo - Cards mais responsivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <Card className="border shadow-sm">
          <CardHeader className="pb-1 p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-base sm:text-xl lg:text-2xl font-bold">{totalVendas}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-1 p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-green-600">{formatCurrency(faturamentoTotal)}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-1 p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-blue-600">{formatCurrency(ticketMedio)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros - Espaçamento reduzido */}
      <Card className="border shadow-sm">
        <CardHeader className="p-2 sm:p-3 pb-1">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Período</label>
              <Select value={filtroData} onValueChange={setFiltroData}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="todos">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Forma de Pagamento</label>
              <Select value={filtroFormaPagamento} onValueChange={setFiltroFormaPagamento}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="pulseira">Pulseira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <Input
                  placeholder="Número da venda ou produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-7 sm:pl-8 h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vendas - Grid responsivo como produtos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
        {isLoading ? (
          Array.from({ length: 16 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-2">
                <div className="h-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : vendas.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma venda encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          vendas.map((venda) => (
            <Card key={venda.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-50 flex items-center justify-center h-16">
                {venda.produto_imagem ? (
                  <img 
                    src={venda.produto_imagem} 
                    alt={venda.produto_nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                )}
              </div>
              
              <CardContent className="p-2">
                <div className="space-y-1">
                  <div>
                    <h3 className="font-semibold text-xs truncate" title={venda.produto_nome}>
                      {venda.produto_nome}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">
                      {venda.numero_autorizacao}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(venda.valor_total)}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getPaymentIcon(venda.forma_pagamento)}
                    </div>
                  </div>
                  
                  <Badge className={`text-xs px-1 py-0 w-full justify-center ${getFormaPagamentoBadge(venda.forma_pagamento)}`}>
                    {venda.forma_pagamento.replace('_', ' ').toUpperCase()}
                  </Badge>
                  
                  <div className="text-xs text-gray-600">
                    Qtd: {venda.quantidade}
                  </div>
                  
                  <div className="text-xs text-gray-500 truncate">
                    {formatDate(venda.data_venda)}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedVenda(venda)}
                        className="w-full text-xs h-6"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm sm:max-w-md mx-2">
                      <DialogHeader>
                        <DialogTitle className="text-sm sm:text-base">Detalhes da Venda</DialogTitle>
                      </DialogHeader>
                      {selectedVenda && (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            {selectedVenda.produto_imagem ? (
                              <img 
                                src={selectedVenda.produto_imagem} 
                                alt={selectedVenda.produto_nome}
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{selectedVenda.produto_nome}</h3>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedVenda.numero_autorizacao}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <p className="font-medium">Quantidade:</p>
                              <p>{selectedVenda.quantidade}</p>
                            </div>
                            <div>
                              <p className="font-medium">Valor Unitário:</p>
                              <p>{formatCurrency(selectedVenda.valor_unitario)}</p>
                            </div>
                            <div>
                              <p className="font-medium">Valor Total:</p>
                              <p className="font-bold text-green-600">{formatCurrency(selectedVenda.valor_total)}</p>
                            </div>
                            <div>
                              <p className="font-medium">Forma Pagamento:</p>
                              <p className="text-xs">{selectedVenda.forma_pagamento.replace('_', ' ')}</p>
                            </div>
                            {selectedVenda.nsu && (
                              <div>
                                <p className="font-medium">NSU:</p>
                                <p className="text-xs">{selectedVenda.nsu}</p>
                              </div>
                            )}
                            {selectedVenda.bandeira && (
                              <div>
                                <p className="font-medium">Bandeira:</p>
                                <p className="text-xs">{selectedVenda.bandeira}</p>
                              </div>
                            )}
                            <div className="col-span-2">
                              <p className="font-medium">Data/Hora:</p>
                              <p className="text-xs">{formatDate(selectedVenda.data_venda)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Vendas;
