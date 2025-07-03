import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Filter,
  Zap,
  Users,
  DollarSign,
  Activity,
  Clock,
  Printer,
  XCircle,
  Plus,
  Minus,
  Trash2,
  CreditCard
} from 'lucide-react';
import { CustomerData } from '@/types/payment';
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
import BarcodeReader from '@/components/BarcodeReader';
import PaymentProviderSelector from '@/components/PaymentProviderSelector';

// Definindo interfaces para os tipos de dados
export interface ProdutoDB {
  id: string;
  nome: string;
  codigo_barras: string;
  preco: number;
  status: string;
  tipo?: string; 
  created_at: string;
  updated_at: string;
  categoria: string;
  estoque: number;
  imagem_url: string;
}

export interface ItemPedidoDB {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string;
  produtos: ProdutoDB | null;
}

export interface PedidoDB {
  id: string;
  numero_pedido: string;
  valor_total: number;
  tipo_pagamento: string;
  status: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
  cliente_nome?: string;
  cliente_documento?: string;
  data_pedido: string;
  terminal_id: string;
}

// Interface para o produto selecionado no leitor
export interface ProdutoVendidoData {
  id: string;
  nome: string;
  preco: number;
  status: string;
  tipo?: string; 
  cliente_nome: string;
  cliente_documento: string;
  codigo_barras?: string;
  valor?: number;
  saldo?: number;
  [key: string]: any; // Allow additional properties
}

export interface VendaFormatada {
  id: string;
  numero_pedido: string;
  valor_total: number;
  tipo_pagamento: string;
  status: string;
  observacoes: string;
  created_at: string;
  cliente_nome: string;
  cliente_documento: string;
  itens: Array<{
    id: string;
    produto_id: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    created_at: string;
    nome: string;
    produto_nome: string;
    produto_codigo_barras: string;
    produto_preco: number;
    produto_status: string;
  }>;
};

// Component with proper return type
const VendaProduto = () => {
  // State declarations
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [vendaAmount, setVendaAmount] = useState<string>('0');
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenda, setSelectedVenda] = useState<VendaFormatada | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<ProdutoDB | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('pix');
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    type: 'individual',
    document_type: 'CPF',
    document: '',
    phones: {
      mobile_phone: {
        country_code: '55',
        area_code: '11',
        number: '999999999'
      }
    },
    address: {
      line_1: 'Rua Exemplo',
      line_2: '123',
      zip_code: '00000000',
      city: 'São Paulo',
      state: 'SP',
      country: 'BR'
    }
  });

  // Função para lidar com a seleção do produto
  const handleProdutoSelecionado = (produto: any) => {
    const produtoDB: ProdutoDB = {
      id: produto.id,
      nome: produto.nome,
      codigo_barras: produto.codigo_barras || '',
      preco: produto.preco,
      status: produto.status,
      tipo: produto.tipo,
      created_at: '',
      updated_at: '',
      categoria: '',
      estoque: 0,
      imagem_url: ''
    };
    setSelectedProduto(produtoDB);
    setVendaAmount(produto.preco.toString());
  };

  // Função para abrir o diálogo de venda
  const handleOpenVendaDialog = (venda: VendaFormatada) => {
    setSelectedVenda(venda);
  };

  // Função para fechar o diálogo de venda
  const handleCloseVendaDialog = () => {
    setSelectedVenda(null);
  };

  // Função para abrir modal de pagamento
  const handleOpenPayment = (venda: VendaFormatada) => {
    setSelectedVenda(venda);
    setShowPaymentModal(true);
  };

  // Fechar modal de pagamento
  const handleClosePayment = () => {
    setSelectedVenda(null);
    setShowPaymentModal(false);
  };

  // Buscar produtos disponíveis para venda com tipo opcional
  const { data: produtos = [], isLoading: loadingProdutos } = useQuery<Array<Omit<ProdutoDB, 'tipo'> & { tipo?: string }>>({
    queryKey: ['produtos'],
    async queryFn() {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar pedidos e itens formatados
  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ['vendas'],
    async queryFn() {
      // Buscar pedidos
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;
      if (!pedidos?.length) return [];

      // Buscar itens dos pedidos
      const { data: itensPedido, error: itensError } = await supabase
        .from('itens_pedido')
        .select('*, produtos(*)')
        .in('pedido_id', pedidos.map(p => p.id));

      if (itensError) throw itensError;

      // Mapear os itens por pedido_id
      const itensPorPedido = (itensPedido || []).reduce<Record<string, ItemPedidoDB[]>>((acc, item) => {
        const pedidoId = item.pedido_id;
        if (!acc[pedidoId]) {
          acc[pedidoId] = [];
        }
        acc[pedidoId].push(item);
        return acc;
      }, {});

      // Mapear para o formato VendaFormatada com tratamento seguro
      return pedidos.map(pedido => {
        const itensPedido = itensPorPedido[pedido.id] || [];
        const pedidoComCliente = pedido as PedidoDB & { cliente_nome?: string; cliente_documento?: string };
        
        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido || `PED-${pedido.id.substring(0, 8).toUpperCase()}`,
          valor_total: pedido.valor_total,
          tipo_pagamento: pedido.tipo_pagamento || '',
          status: pedido.status,
          observacoes: pedido.observacoes || '',
          created_at: pedido.created_at,
          cliente_nome: pedidoComCliente.cliente_nome || 'Cliente não identificado',
          cliente_documento: pedidoComCliente.cliente_documento || '',
          itens: itensPedido.map(item => ({
            id: item.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade || 1,
            preco_unitario: item.preco_unitario || 0,
            subtotal: item.subtotal || 0,
            created_at: item.created_at,
            nome: item.produtos?.nome || 'Produto sem nome',
            produto_nome: item.produtos?.nome || 'Produto sem nome',
            produto_codigo_barras: item.produtos?.codigo_barras || '',
            produto_preco: item.produtos?.preco || 0,
            produto_status: item.produtos?.status || 'inativo'
          }))
        } as VendaFormatada;
      });
    },
  });

  // Função para imprimir o comprovante de venda
  const handlePrintVenda = (venda: VendaFormatada) => {
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Formatar os itens do pedido
    const itensHtml = venda.itens.map(item => 
      `<tr>
        <td>${item.quantidade}x</td>
        <td>${item.produto_nome}</td>
        <td>R$ ${item.preco_unitario.toFixed(2)}</td>
        <td>R$ ${item.subtotal.toFixed(2)}</td>
      </tr>`
    ).join('');
    
    // HTML para impressão
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante de Venda - ${venda.numero_pedido}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .info { margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; margin-top: 10px; text-align: right; }
          .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Comprovante de Venda</h2>
          <p>Nº ${venda.numero_pedido}</p>
          <p>${new Date(venda.created_at).toLocaleString()}</p>
        </div>
        
        <div class="info">
          <p><strong>Status:</strong> ${venda.status}</p>
          <p><strong>Forma de Pagamento:</strong> ${venda.tipo_pagamento}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Qtd</th>
              <th>Produto</th>
              <th>Valor Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itensHtml}
          </tbody>
        </table>
        
        <div class="total">
          <p>Total: R$ ${venda.valor_total.toFixed(2)}</p>
        </div>
        
        <div class="footer">
          <p>Obrigado pela preferência!</p>
          <p>${new Date().getFullYear()} - ${window.location.hostname}</p>
        </div>
        
        <script>
          // Fechar a janela após a impressão
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 100);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Função para cancelar uma venda
  const handleCancelarVenda = async (venda: VendaFormatada) => {
    if (venda.status === 'cancelado') {
      toast.warning('Este pedido já foi cancelado.');
      return;
    }

    if (!confirm('Tem certeza que deseja cancelar este pedido?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'cancelado' })
        .eq('id', venda.id);

      if (error) throw error;

      toast.success('Pedido cancelado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast.error('Erro ao cancelar pedido. Tente novamente.');
    }
  };

  // Função para finalizar uma venda
  const handleFinalizarVenda = async (venda: VendaFormatada) => {
    if (venda.status === 'cancelado') {
      toast.warning('Este pedido já foi cancelado.');
      return;
    }

    const confirmCancel = confirm(`Tem certeza que deseja cancelar o pedido ${venda.numero_pedido}?\nEsta ação não pode ser desfeita.`);
    if (!confirmCancel) {
      return;
    }

    try {
      // Atualizar o status do pedido para cancelado
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'cancelado' })
        .eq('id', venda.id);

      if (error) throw error;

      // Atualizar a lista de vendas
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Pedido cancelado com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast.error('Erro ao cancelar pedido. Tente novamente.');
    }
  };

  // Função para processar uma nova venda
  const handleVenda = () => {
    if (!selectedProduto || !vendaAmount) {
      toast.error('Selecione um produto e informe o valor da venda');
      return;
    }
    
    // Lógica para processar a venda
    const vendaData = {
      produto_id: selectedProduto.id,
      valor: parseFloat(vendaAmount) || 0,
      tipo_pagamento: paymentMethod === 'pix' ? 'pix' : (paymentMethod || 'dinheiro'),
      status: 'pendente',
      itens: [
        {
          produto_id: selectedProduto.id,
          quantidade: 1,
          preco_unitario: parseFloat(vendaAmount) || 0,
          subtotal: parseFloat(vendaAmount) || 0,
          produtos: {
            id: selectedProduto.id,
            nome: selectedProduto.nome || 'Produto sem nome',
            codigo_barras: selectedProduto.codigo_barras || '',
            preco: parseFloat(vendaAmount) || 0,
            status: 'ativo',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            categoria: '',
            estoque: 0,
            imagem_url: ''
          },
          id: '',
          pedido_id: '',
          created_at: new Date().toISOString()
        }
      ]
    };
    
    // Aqui você pode adicionar a lógica para salvar a venda no banco de dados
    console.log('Dados da venda:', vendaData);
    
    if (selectedProduto.status !== 'ativo') {
      toast.error('Só é possível vender produtos ativos');
      return;
    }

    const amount = parseFloat(vendaAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('O valor da venda deve ser maior que zero');
      return;
    }

    if (amount > (selectedProduto.preco || 0)) {
      toast.error('Valor da venda não pode ser maior que o saldo disponível');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentMethod: 'pix' | 'dinheiro') => {
    if (!selectedProduto || !vendaAmount) return;
    
    // Atualiza o estado do método de pagamento
    setPaymentMethod(paymentMethod);
    
    // Aqui você pode adicionar a lógica para salvar a venda no banco de dados
    console.log('Dados da venda:', {
      produto_id: selectedProduto.id,
      valor: vendaAmount,
      tipo_pagamento: paymentMethod, // Usa o método de pagamento recebido
      status: 'pendente',
      itens: [
        {
          produto_id: selectedProduto.id,
          quantidade: 1,
          preco_unitario: vendaAmount,
          subtotal: vendaAmount,
          produtos: {
            id: selectedProduto.id,
            nome: selectedProduto.nome || 'Produto sem nome',
            codigo_barras: selectedProduto.codigo_barras || '',
            preco: vendaAmount,
            status: 'ativo'
          }
        }
      ]
    });
    
    // Atualizar cache
    queryClient.invalidateQueries({ queryKey: ['vendas_produtos'] });
    queryClient.invalidateQueries({ queryKey: ['produtos_ativos'] });
  };

  const valorTotalVendas = useMemo(() => 
    Array.isArray(vendas) 
      ? vendas.reduce((acc, v) => v ? acc + (v.valor_total || 0) : acc, 0)
      : 0,
    [vendas]
  );

  const vendasHoje = useMemo(() => 
    Array.isArray(vendas) 
      ? vendas.filter(v => v && new Date(v.created_at).toDateString() === new Date().toDateString())
      : [],
    [vendas]
  );

  const valorHoje = useMemo(
    () => vendasHoje.reduce((acc, v) => v ? acc + (v.valor_total || 0) : acc, 0),
    [vendasHoje]
  );

  // Filtrar vendas pelo termo de busca
  const filteredVendas = useMemo(() => {
    if (!searchTerm || !Array.isArray(vendas)) return vendas || [];
    
    const term = searchTerm.toLowerCase();
    return vendas.filter(venda => 
      venda?.numero_pedido?.toLowerCase().includes(term) ||
      (venda?.cliente_nome && venda.cliente_nome.toLowerCase().includes(term)) ||
      venda?.itens?.some(item => 
        item?.produto_nome && item.produto_nome.toLowerCase().includes(term)
      )
    );
  }, [vendas, searchTerm]);

  const handleVendaAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permitir apenas números e ponto decimal
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setVendaAmount(value);
    }
  };

  // Função para processar o pagamento
  const handleProcessPayment = async () => {
    const amount = parseFloat(vendaAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor, insira um valor válido para o pagamento');
      return;
    }

    if (amount > 10000) {
      toast.error('O valor máximo por transação é de R$ 10.000,00');
      return;
    }

    setIsProcessingPayment(true);
    setShowPaymentModal(true);
  };

  return (
    <div className="pl-4 pr-4 sm:pl-6 sm:pr-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Venda de Produtos</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar vendas..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalVendas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Array.isArray(vendas) ? vendas.length : 0} vendas realizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorHoje)}
            </div>
            <p className="text-xs text-muted-foreground">
              {vendasHoje.length} vendas hoje
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(produtos) ? produtos.length : 0}</div>
            <p className="text-xs text-muted-foreground">
              {Array.isArray(produtos) ? produtos.filter((p) => p.status === 'ativo').length : 0} ativos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <BarcodeReader onCodeRead={handleProdutoSelecionado} placeholder="Código do produto" />
              
              {selectedProduto && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Produto:</span>
                    <span>{selectedProduto.codigo_barras}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = parseFloat(vendaAmount) || 0;
                        setVendaAmount(Math.max(0, current - 1).toString());
                      }}
                      disabled={!vendaAmount || parseFloat(vendaAmount) <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="text"
                      inputMode="decimal"
                      min="1"
                      value={vendaAmount}
                      onChange={handleVendaAmountChange}
                      className="w-20 text-center"
                      disabled={!selectedProduto}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = parseFloat(vendaAmount) || 0;
                        setVendaAmount((current + 1).toString());
                      }}
                      disabled={!selectedProduto}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p>Carregando...</p>
                </div>
              ) : filteredVendas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2" />
                  <p>Nenhuma venda encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Pedido</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendas.map((venda) => (
                        <TableRow key={venda.id}>
                          <TableCell className="font-medium">{venda.numero_pedido}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {venda.itens?.map((item) => (
                                <div key={item.id} className="text-sm">
                                  {item.quantidade}x {item.produto_nome} - R$ {item.preco_unitario.toFixed(2)}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>R$ {venda.valor_total.toFixed(2)}</TableCell>
                          <TableCell>{new Date(venda.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={venda.status === 'concluido' ? 'default' : 'secondary'}>
                              {venda.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePrintVenda(venda)}
                                title="Imprimir"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              {venda.status !== 'cancelado' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenPayment(venda)}
                                  disabled={isProcessingPayment}
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showPaymentModal && selectedProduto && vendaAmount && (
        <PaymentProviderSelector
          valor={parseFloat(vendaAmount) || 0}
          recargaId={selectedProduto?.id || ''}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
          customer={customerData}
        />
      )}
    </div>
  );
};

export default VendaProduto;
