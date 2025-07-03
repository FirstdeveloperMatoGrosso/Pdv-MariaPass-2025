import React, { useState, useEffect } from 'react';
import { useCancelamentos } from '@/hooks/useCancelamentos';
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
  MapPin,
  Copy,
  Check,
  Printer,
  XCircle,
  FileText
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
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
import { useQuery } from '@tanstack/react-query';
import ExportButton from '@/components/ExportButton';
import { generateReportPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import SaleDetails from '@/components/SaleDetails';
import CancelamentoModal from '@/components/CancelamentoModal';
import { ComprovanteDialog } from '@/components/ComprovanteDialog';

import { VendaPulseira } from '@/types/venda';

interface VendaRealizada extends Omit<VendaPulseira, 'created_at' | 'updated_at'> {
  // Campos específicos adicionais podem ser adicionados aqui
}

interface CancelamentoExistente {
  id: string;
  data_cancelamento: string;
  numero_pedido: string;
  motivo: string;
  valor_cancelado: number;
  aprovado: boolean;
  // Campos adicionais para o comprovante
  forma_pagamento?: string;
  codigo_autorizacao?: string;
  estabelecimento?: string;
  endereco_estabelecimento?: string;
  cnpj_estabelecimento?: string;
  operador?: string;
  produto_nome?: string;
  produto_quantidade?: number;
  produto_imagem?: string;
}

const Vendas: React.FC = () => {
  const [filtroData, setFiltroData] = useState('hoje');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState('todas');
  const [busca, setBusca] = useState('');
  const [selectedVenda, setSelectedVenda] = useState<VendaRealizada | null>(null);
  const [copied, setCopied] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [comprovanteAberto, setComprovanteAberto] = useState(false);
  const [cancelamentoExistente, setCancelamentoExistente] = useState<CancelamentoExistente | null>(null);
  
  const { buscarCancelamentoPorPedido } = useCancelamentos();

  // Verifica se já existe cancelamento para a venda selecionada
  useEffect(() => {
    const verificarCancelamento = async () => {
      if (selectedVenda) {
        try {
          // Primeiro verifica se existe um cancelamento registrado
          const cancelamento = await buscarCancelamentoPorPedido(selectedVenda.numero_autorizacao);
          
          if (cancelamento) {
            setCancelamentoExistente({
              id: cancelamento.id,
              data_cancelamento: cancelamento.data_cancelamento,
              numero_pedido: cancelamento.numero_pedido,
              motivo: cancelamento.motivo,
              valor_cancelado: cancelamento.valor_cancelado,
              aprovado: cancelamento.aprovado
            });
            
            // Se o cancelamento estiver aprovado, garante que o status está correto
            if (cancelamento.aprovado && selectedVenda.status !== 'cancelada') {
              // Atualiza o status localmente para refletir o cancelamento
              selectedVenda.status = 'cancelada';
            }
            return;
          }
          
          // Se não encontrou cancelamento, verifica se o status está como cancelada
          if (selectedVenda.status === 'cancelada') {
            setCancelamentoExistente({
              id: 'sistema',
              data_cancelamento: new Date().toISOString(),
              numero_pedido: selectedVenda.numero_autorizacao,
              motivo: 'Venda cancelada anteriormente',
              valor_cancelado: selectedVenda.valor_total,
              aprovado: true
            });
            return;
          }
          
          // Se não encontrou cancelamento e o status não é cancelada, limpa o estado
          setCancelamentoExistente(null);
        } catch (error) {
          console.error('Erro ao verificar cancelamento:', error);
          setCancelamentoExistente(null);
        }
      } else {
        setCancelamentoExistente(null);
      }
    };

    verificarCancelamento();
  }, [selectedVenda]);

  const copyToClipboard = (text: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Buscar vendas realizadas
  const { data: vendas = [], isLoading, refetch, error } = useQuery<VendaRealizada[]>({
    queryKey: ['vendas', filtroData, filtroFormaPagamento, busca],
    queryFn: async () => {
      console.log('Buscando vendas realizadas...');
      
      try {
        // Formata as datas para o formato YYYY-MM-DD
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

        // Define os campos da consulta incluindo o status
        // Define a consulta base para buscar pedidos com seus itens e produtos
        let query = supabase
          .from('pedidos')
          .select(`
            id,
            data_pedido,
            numero_pedido,
            status,
            tipo_pagamento,
            valor_total,
            itens:itens_pedido(
              quantidade,
              preco_unitario,
              subtotal,
              produto:produtos(
                id,
                nome,
                imagem_url
              )
            )
          `)
          .gte('data_pedido', dataInicio.toISOString())
          .lte('data_pedido', dataFim.toISOString())
          .order('data_pedido', { ascending: false })
          .limit(100);

        // Aplica filtros adicionais se necessário
        if (filtroFormaPagamento !== 'todas') {
          query = query.eq('tipo_pagamento', filtroFormaPagamento);
        }
        
        if (busca.trim()) {
          query = query.or(`numero_pedido.ilike.%${busca}%,itens.produto.nome.ilike.%${busca}%`);
        }
        
        // Executa a consulta
        const { data, error: queryError } = await query;
        
        if (queryError) {
          console.error('Erro ao buscar vendas:', queryError);
          toast.error('Erro ao carregar as vendas. Tente novamente.');
          return [];
        }
        
        // Processa os pedidos e itens para o formato esperado
        const vendasMapeadas = (data || []).flatMap((pedido: any) => {
          // Se não houver itens, retorna um pedido vazio
          if (!pedido.itens || pedido.itens.length === 0) {
            return [{
              id: pedido.id,
              data_venda: pedido.data_pedido,
              numero_autorizacao: pedido.numero_pedido || `PED-${pedido.id.slice(0, 8)}`,
              status: pedido.status || 'pendente',
              forma_pagamento: pedido.tipo_pagamento || 'Não informado',
              valor_total: Number(pedido.valor_total) || 0,
              produto_nome: 'Nenhum item',
              produto_imagem: undefined,
              quantidade: 0,
              valor_unitario: 0,
              nsu: '',
              bandeira: ''
            }];
          }
          
          // Para cada item, cria uma entrada no array de vendas
          return pedido.itens.map((item: any) => ({
            id: `${pedido.id}-${item.produto?.id || '0'}`,
            data_venda: pedido.data_pedido,
            numero_autorizacao: pedido.numero_pedido || `PED-${pedido.id.slice(0, 8)}`,
            status: pedido.status || 'pendente',
            forma_pagamento: pedido.tipo_pagamento || 'Não informado',
            valor_total: Number(item.subtotal) || 0,
            produto_nome: item.produto?.nome || 'Produto não identificado',
            produto_imagem: item.produto?.imagem_url || '',
            quantidade: Number(item.quantidade) || 1,
            valor_unitario: Number(item.preco_unitario) || 0,
            nsu: '',
            bandeira: ''
          }));
        });

        console.log('Vendas encontradas:', vendasMapeadas.length);
        return vendasMapeadas;
      } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        toast.error('Erro ao carregar as vendas. Tente novamente.');
        return [];
      }
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
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportPDF = () => {
    try {
      const companyData = {
        name: 'MariaPass',
        address: 'Endereço da empresa, 123, Bairro, Cidade - UF',
        cnpj: '00.000.000/0001-00',
        email: 'contato@mariapass.com.br',
        phone: '(00) 00000-0000'
      };

      const pdf = generateReportPDF(companyData, {
        period: 'Período do Relatório',
        salesData: {
          total: faturamentoTotal,
          orders: totalVendas,
          avgTicket: ticketMedio
        },
        topProducts: vendas
          .reduce((acc: any[], venda) => {
            const existing = acc.find(item => item.name === venda.produto_nome);
            if (existing) {
              existing.quantity += venda.quantidade;
              existing.revenue += venda.valor_total;
            } else {
              acc.push({
                name: venda.produto_nome || 'Produto sem nome',
                quantity: venda.quantidade,
                revenue: venda.valor_total
              });
            }
            return acc;
          }, [])
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
        recentOrders: vendas.slice(0, 5).map(venda => ({
          id: venda.numero_autorizacao,
          time: new Date(venda.data_venda).toLocaleTimeString('pt-BR'),
          items: venda.quantidade,
          total: venda.valor_total,
          status: 'Concluído'
        }))
      });

      const fileName = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar o relatório. Tente novamente.');
    }
  };

  const handlePrint = () => {
    try {
      const companyData = {
        name: 'MariaPass',
        address: 'Endereço da empresa, 123, Bairro, Cidade - UF',
        cnpj: '00.000.000/0001-00',
        email: 'contato@mariapass.com.br',
        phone: '(00) 00000-0000'
      };

      const pdf = generateReportPDF(companyData, {
        period: 'Período do Relatório',
        salesData: {
          total: faturamentoTotal,
          orders: totalVendas,
          avgTicket: ticketMedio
        },
        topProducts: vendas
          .reduce((acc: any[], venda) => {
            const existing = acc.find(item => item.name === venda.produto_nome);
            if (existing) {
              existing.quantity += venda.quantidade;
              existing.revenue += venda.valor_total;
            } else {
              acc.push({
                name: venda.produto_nome || 'Produto sem nome',
                quantity: venda.quantidade,
                revenue: venda.valor_total
              });
            }
            return acc;
          }, [])
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
        recentOrders: vendas.slice(0, 5).map(venda => ({
          id: venda.numero_autorizacao,
          time: new Date(venda.data_venda).toLocaleTimeString('pt-BR'),
          items: venda.quantidade,
          total: venda.valor_total,
          status: 'Concluído'
        }))
      });
      
      // Abre a janela de impressão do navegador
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = function() {
          printWindow.print();
        };
      }
      
      toast.success('Abrindo visualização de impressão...');
    } catch (error) {
      console.error('Erro ao preparar impressão:', error);
      toast.error('Erro ao preparar a impressão. Tente novamente.');
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      // Primeiro, gera o PDF em memória
      const companyData = {
        name: 'MariaPass',
        address: 'Endereço da empresa, 123, Bairro, Cidade - UF',
        cnpj: '00.000.000/0001-00',
        email: 'contato@mariapass.com.br',
        phone: '(00) 00000-0000'
      };

      const pdf = generateReportPDF(companyData, {
        period: 'Período do Relatório',
        salesData: {
          total: faturamentoTotal,
          orders: totalVendas,
          avgTicket: ticketMedio
        },
        topProducts: vendas
          .reduce((acc: any[], venda) => {
            const existing = acc.find(item => item.name === venda.produto_nome);
            if (existing) {
              existing.quantity += venda.quantidade;
              existing.revenue += venda.valor_total;
            } else {
              acc.push({
                name: venda.produto_nome || 'Produto sem nome',
                quantity: venda.quantidade,
                revenue: venda.valor_total
              });
            }
            return acc;
          }, [])
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
        recentOrders: vendas.slice(0, 5).map(venda => ({
          id: venda.numero_autorizacao,
          time: new Date(venda.data_venda).toLocaleTimeString('pt-BR'),
          items: venda.quantidade,
          total: venda.valor_total,
          status: 'Concluído'
        }))
      });

      // Converte o PDF para base64
      const pdfBase64 = pdf.output('datauristring');
      
      // Mensagem para o WhatsApp
      const message = `📊 *Relatório de Vendas*\n\n` +
        `📅 Total de Vendas: ${totalVendas}\n` +
        `💰 Faturamento Total: R$ ${faturamentoTotal.toFixed(2)}\n` +
        `🎟️ Ticket Médio: R$ ${ticketMedio.toFixed(2)}\n\n` +
        `_Gerado pelo Sistema MariaPass_`;
      
      const encodedMessage = encodeURIComponent(message);
      
      // Abre o WhatsApp Web com a mensagem (não é possível anexar o PDF diretamente)
      // Em um ambiente mobile com o app instalado, isso abriria o app do WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      // Informa ao usuário sobre a limitação do compartilhamento de PDF
      toast.info('O PDF foi gerado, mas não pode ser enviado diretamente pelo navegador. Por favor, faça o download e envie manualmente pelo WhatsApp.');
      
      // Oferece para baixar o PDF também
      const fileName = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Erro ao compartilhar via WhatsApp:', error);
      toast.error('Erro ao preparar o compartilhamento. Tente novamente.');
    }
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
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return (
      <div className="min-h-screen p-2 sm:p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-red-600 mb-4 text-sm">Erro ao carregar vendas: {errorMessage}</p>
            <Button onClick={() => refetch()} size="sm">Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageLayout
      title="Vendas Realizadas"
      icon={<ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
      headerRight={
        <ExportButton 
          onExportPDF={handleExportPDF}
          onPrint={handlePrint}
          onShareWhatsApp={handleShareWhatsApp}
        />
      }
      className="space-y-4"
    >

      {/* Resumo - Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-6 py-3 w-full">
        <Card className="border shadow-sm">
          <CardHeader className="pb-0 p-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="text-base sm:text-xl lg:text-2xl font-bold">{totalVendas}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-0 p-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-green-600">{formatCurrency(faturamentoTotal)}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-0 p-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-blue-600">{formatCurrency(ticketMedio)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="px-4 sm:px-6">
        <Card className="border shadow-sm w-full rounded-lg p-2">
          <CardHeader className="p-1 pb-0">
            <CardTitle className="flex items-center space-x-2 text-xs sm:text-sm">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-1 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2">
            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Período</label>
              <Select value={filtroData} onValueChange={setFiltroData}>
                <SelectTrigger className="h-7 sm:h-8 text-xs sm:text-sm">
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

            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Forma de Pagamento</label>
              <Select value={filtroFormaPagamento} onValueChange={setFiltroFormaPagamento}>
                <SelectTrigger className="h-7 sm:h-8 text-xs sm:text-sm">
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

            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <Input
                  placeholder="Número da venda ou produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-7 sm:pl-8 h-7 sm:h-8 text-xs sm:text-sm"
                />
              </div>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vendas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 w-full px-6 py-3">
        {isLoading ? (
          Array.from({ length: 16 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-1.5">
                <div className="h-14 bg-gray-200 rounded mb-1.5"></div>
                <div className="h-2.5 bg-gray-200 rounded mb-1"></div>
                <div className="h-2.5 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : vendas.length === 0 ? (
          <div className="col-span-full text-center py-6">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma venda encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          vendas.map((venda) => (
            <Card key={venda.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-50 flex items-center justify-center h-14">
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
              
              <CardContent className="p-1.5">
                <div className="space-y-0.5">
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
                        className="w-full text-xs h-5"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md mx-2 sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-sm sm:text-base">Detalhes da Venda</DialogTitle>
                      </DialogHeader>
                      {selectedVenda && (
                        <div className="space-y-4">
                          <Tabs defaultValue="detalhes" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                              <TabsTrigger value="verificacao">Verificação</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="detalhes" className="space-y-4">
                              <div className="border rounded-lg p-3 bg-gray-50">
                                <h3 className="font-medium text-sm mb-2">Informações do Produto</h3>
                                <div className="flex items-start space-x-3">
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
                                      <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-sm sm:text-base">{selectedVenda.produto_nome}</h3>
                                    <div className="flex items-center mt-1">
                                      <p className="text-xs text-gray-600">{selectedVenda.numero_autorizacao}</p>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-4 w-4 ml-1 text-gray-500 hover:text-gray-700"
                                        onClick={(e) => copyToClipboard(selectedVenda.numero_autorizacao, e)}
                                      >
                                        {copied ? (
                                          <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                    <div className="mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {selectedVenda.forma_pagamento.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-3 bg-gray-50">
                                  <h3 className="font-medium text-sm mb-2">Detalhes da Venda</h3>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Quantidade:</span>
                                      <span className="font-medium">{selectedVenda.quantidade}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Valor Unitário:</span>
                                      <span>{formatCurrency(selectedVenda.valor_unitario)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold">
                                      <span>Total:</span>
                                      <span className="text-green-600">{formatCurrency(selectedVenda.valor_total)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="border rounded-lg p-3 bg-gray-50">
                                  <h3 className="font-medium text-sm mb-2">Informações Adicionais</h3>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Data/Hora:</span>
                                      <span>{formatDate(selectedVenda.data_venda)}</span>
                                    </div>
                                    {selectedVenda.nsu && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">NSU:</span>
                                        <span>{selectedVenda.nsu}</span>
                                      </div>
                                    )}
                                    {selectedVenda.bandeira && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Bandeira:</span>
                                        <span>{selectedVenda.bandeira}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="verificacao">
                              <SaleDetails
                                saleId={selectedVenda.id}
                                productId={selectedVenda.id}
                                productName={selectedVenda.produto_nome || 'Produto não especificado'}
                                paymentMethod={selectedVenda.forma_pagamento}
                                nsu={selectedVenda.nsu || selectedVenda.numero_autorizacao}
                                hash={selectedVenda.numero_autorizacao}
                                barcode={selectedVenda.id.padEnd(13, '0').substring(0, 13)}
                                total={selectedVenda.valor_total}
                                date={selectedVenda.data_venda}
                                quantity={selectedVenda.quantidade}
                                unitPrice={selectedVenda.valor_unitario}
                              />
                            </TabsContent>
                          </Tabs>
                              <div className="flex justify-end">
                                {cancelamentoExistente || selectedVenda.status === 'cancelada' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white mt-2 w-full"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (cancelamentoExistente) {
                                        setComprovanteAberto(true);
                                      } else {
                                        setCancelModalOpen(true);
                                      }
                                    }}
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {cancelamentoExistente?.aprovado || selectedVenda.status === 'cancelada' ? 'Comprovante de Cancelamento' : 'Cancelamento Pendente'}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white mt-2 w-full"
                                    onClick={() => setCancelModalOpen(true)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancelar Venda
                                  </Button>
                                )}
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
      {selectedVenda && (
        <CancelamentoModal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          produto={{
            id: selectedVenda.id,
            nome: selectedVenda.produto_nome || 'Produto não identificado',
            preco: cancelamentoExistente?.valor_cancelado || selectedVenda.valor_total,
            categoria: selectedVenda.forma_pagamento,
            numero_pedido: cancelamentoExistente?.numero_pedido || selectedVenda.numero_autorizacao,
          }}
          modoVisualizacao={!!cancelamentoExistente}
          onPrintComplete={async () => {
            // Atualiza o estado de cancelamentoExistente após o cancelamento
            try {
              const cancelamento = await buscarCancelamentoPorPedido(selectedVenda.numero_autorizacao);
              setCancelamentoExistente(cancelamento ? {
                id: cancelamento.id,
                data_cancelamento: cancelamento.data_cancelamento,
                numero_pedido: cancelamento.numero_pedido || selectedVenda.numero_autorizacao,
                motivo: cancelamento.motivo || 'Motivo não especificado',
                valor_cancelado: cancelamento.valor_cancelado || selectedVenda.valor_total,
                aprovado: cancelamento.aprovado || false
              } : null);
            } catch (error) {
              console.error('Erro ao verificar cancelamento:', error);
            }
            setCancelModalOpen(false);
          }}
        />
      )}

      {/* Diálogo do Comprovante */}
      {selectedVenda && cancelamentoExistente && (
        <ComprovanteDialog
          isOpen={comprovanteAberto}
          onClose={() => setComprovanteAberto(false)}
          data={{
            ...cancelamentoExistente,
            id: cancelamentoExistente.id,
            numero_pedido: cancelamentoExistente.numero_pedido || selectedVenda.numero_autorizacao,
            valor_cancelado: cancelamentoExistente.valor_cancelado || selectedVenda.valor_total,
            motivo: cancelamentoExistente.motivo || 'Motivo não especificado',
            data_cancelamento: cancelamentoExistente.data_cancelamento || new Date().toISOString(),
            forma_pagamento: selectedVenda.forma_pagamento,
            codigo_autorizacao: selectedVenda.numero_autorizacao,
            produto_nome: selectedVenda.produto_nome,
            produto_quantidade: selectedVenda.quantidade,
            produto_imagem: selectedVenda.produto_imagem,
            operador: 'Sistema'
          }}
        />
      )}
    </PageLayout>
  );
};

export default Vendas;
