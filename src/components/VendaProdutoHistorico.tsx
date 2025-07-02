import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CreditCard, Package, Tag, Loader2, ShoppingCart, MapPin, DollarSign, Hash } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

// Tipos base
type ItemPedido = {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string;
  produto_vendido_id: string;
};

type Pedido = {
  id: string;
  tipo_pagamento: string;
  numero_pedido: string | null;
  data_pedido: string;
  created_at: string;
};

type Produto = {
  id: string;
  nome: string;
  codigo_barras: string | null;
};

// Tipos auxiliares
type ProdutoVenda = {
  nome: string;
  codigo_barras: string | null;
};

type TerminalVenda = {
  nome: string;
  localizacao: string;
};

// Função para buscar itens de pedido por ID do produto
async function fetchItensPedido(produtoId: string): Promise<ItemPedido[]> {
  try {
    // Busca os itens de pedido pelo ID do produto
    const { data, error } = await supabase
      .from('itens_pedido')
      .select('*')
      .eq('produto_id', produtoId);
    
    if (error) throw error;
    
    // Converte para o tipo ItemPedido
    return (data || []).map(item => ({
      id: String(item.id || ''),
      pedido_id: String(item.pedido_id || ''),
      produto_id: String(item.produto_id || ''),
      quantidade: Number(item.quantidade) || 0,
      preco_unitario: Number(item.preco_unitario) || 0,
      subtotal: Number(item.subtotal) || 0,
      created_at: String(item.created_at || new Date().toISOString()),
      produto_vendido_id: String(item.produto_id || '') // Usando produto_id como produto_vendido_id
    }));
  } catch (error) {
    console.error('Erro ao buscar itens do pedido:', error);
    return [];
  }
}

// Função para buscar pedidos por IDs
async function fetchPedidos(ids: string[]): Promise<Pedido[]> {
  if (!ids.length) return [];
  
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .in('id', ids);
    
    if (error) throw error;
    
    // Converte para o tipo Pedido
    return (data || []).map(pedido => ({
      id: String(pedido.id || ''),
      tipo_pagamento: String(pedido.tipo_pagamento || ''),
      numero_pedido: pedido.numero_pedido ? String(pedido.numero_pedido) : null,
      data_pedido: String(pedido.data_pedido || ''),
      created_at: String(pedido.created_at || new Date().toISOString())
    }));
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
}

// Função para buscar produtos por IDs
async function fetchProdutos(ids: string[]): Promise<Produto[]> {
  if (!ids.length) return [];
  
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .in('id', ids);
    
    if (error) throw error;
    
    // Converte para o tipo Produto
    return (data || []).map(produto => ({
      id: String(produto.id || ''),
      nome: String(produto.nome || ''),
      codigo_barras: produto.codigo_barras ? String(produto.codigo_barras) : null
    }));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

// Interface para o histórico de vendas
type VendaHistorico = {
  id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  forma_pagamento: string;
  numero_autorizacao?: string | null;
  nsu?: string | null;
  bandeira?: string | null;
  data_venda: string;
  nome?: string;
  codigo_barras?: string | null;
  produtos?: {
    nome?: string;
    codigo_barras?: string | null;
  };
  terminais?: {
    nome?: string;
    localizacao?: string;
  };
};

interface VendaProdutoHistoricoProps {
  produtoVendidoId: string;
  codigoProduto: string;
}

const VendaProdutoHistorico: React.FC<VendaProdutoHistoricoProps> = ({ produtoVendidoId, codigoProduto }) => {
  const fetchVendas = useCallback(async () => {
    try {
      // 1. Busca os itens de pedido pelo ID do produto
      const itens = await fetchItensPedido(produtoVendidoId);
      if (!itens || !itens.length) return [];

      // 2. Busca os pedidos relacionados
      const pedidosIds = [...new Set(itens.map(item => item.pedido_id).filter(Boolean))];
      const pedidos = pedidosIds.length > 0 ? await fetchPedidos(pedidosIds) : [];

      // 3. Busca os produtos relacionados
      const produtosIds = [...new Set(itens.map(item => item.produto_id).filter(Boolean))];
      const produtos = produtosIds.length > 0 ? await fetchProdutos(produtosIds) : [];

      // 4. Cria mapas para acesso rápido
      const pedidosMap = new Map<string, Pedido>();
      pedidos.forEach(pedido => pedidosMap.set(pedido.id, pedido));
      
      const produtosMap = new Map<string, Produto>();
      produtos.forEach(produto => produtosMap.set(produto.id, produto));

      // 5. Transforma os itens no formato esperado
      return itens.map(item => {
        const pedido = pedidosMap.get(item.pedido_id);
        const produto = produtosMap.get(item.produto_id);
        
        // Cria o objeto venda com todas as propriedades obrigatórias
        const venda: VendaHistorico = {
          id: item.id,
          quantidade: item.quantidade,
          valor_unitario: item.preco_unitario,
          valor_total: item.subtotal,
          forma_pagamento: pedido?.tipo_pagamento || 'desconhecido',
          data_venda: pedido?.data_pedido || item.created_at,
          
          // Propriedades opcionais
          ...(pedido?.numero_pedido && { numero_autorizacao: pedido.numero_pedido }),
          
          // Produto relacionado
          ...(produto && {
            nome: produto.nome,
            codigo_barras: produto.codigo_barras,
            produtos: {
              nome: produto.nome,
              codigo_barras: produto.codigo_barras
            }
          }),
          
          // Informações do terminal com valores padrão
          terminais: {
            nome: 'Terminal',
            localizacao: 'Localização não especificada'
          }
        };
        
        return venda;
      });
    } catch (error) {
      console.error('Erro ao buscar histórico de vendas:', error);
      return [];
    }
  }, [produtoVendidoId]);

  // Configuração da query para buscar o histórico de vendas
  const { data, isLoading, error } = useQuery<VendaHistorico[]>({
    queryKey: ['historico_pedidos', produtoVendidoId],
    queryFn: fetchVendas,
    enabled: !!produtoVendidoId, // Só executa se produtoVendidoId estiver definido
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    retry: 2 // Número de tentativas em caso de erro
  });
  
  // Se houver erro, exibe mensagem de erro
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Ocorreu um erro ao carregar o histórico de vendas. Tente novamente mais tarde.
      </div>
    );
  }
  
  // Garante que vendasData seja sempre um array
  const vendasData: VendaHistorico[] = Array.isArray(data) ? data : [];

  const getPaymentIcon = (forma: string) => {
    switch (forma) {
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="w-3 h-3" />;
      case 'debito_pulseira':
        return <DollarSign className="w-3 h-3" />;
      default:
        return <Hash className="w-3 h-3" />;
    }
  };

  const getPaymentLabel = (forma: string) => {
    const labels: { [key: string]: string } = {
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'debito_pulseira': 'Débito em Conta',
      'pix': 'PIX',
      'dinheiro': 'Dinheiro'
    };
    return labels[forma] || forma;
  };

  const getBandeiraColor = (bandeira: string | null) => {
    if (!bandeira) return 'bg-gray-100 text-gray-800';
    switch (bandeira.toLowerCase()) {
      case 'visa': return 'bg-blue-100 text-blue-800';
      case 'mastercard': return 'bg-red-100 text-red-800';
      case 'elo': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando histórico do produto {codigoProduto}...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <ShoppingCart className="w-5 h-5 text-green-600" />
          <span>Histórico de Compras - {codigoProduto}</span>
          <Badge variant="outline">{vendasData.length} transações</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {vendasData.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>Nenhuma venda encontrada para o produto {codigoProduto}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] h-8 text-xs">Produto</TableHead>
                  <TableHead className="h-8 text-xs">Qtd</TableHead>
                  <TableHead className="h-8 text-xs">Valor</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Pagamento</TableHead>
                  <TableHead className="hidden md:table-cell h-8 text-xs">NSU</TableHead>
                  <TableHead className="hidden md:table-cell h-8 text-xs">Autorização</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Bandeira</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Terminal</TableHead>
                  <TableHead className="hidden xl:table-cell h-8 text-xs">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendasData.map((venda: VendaHistorico) => (
                  <TableRow key={venda.id}>
                    <TableCell className="p-2">
                      <div>
                        <div className="text-xs font-semibold">
                          {venda.produtos?.nome || 'Produto não encontrado'}
                        </div>
                        {venda.produtos?.codigo_barras && (
                          <div className="text-xs text-gray-500">
                            {venda.produtos.codigo_barras}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-2 text-xs">{venda.quantidade}</TableCell>
                    <TableCell className="p-2">
                      <div className="text-xs">
                        <div className="font-semibold text-green-600">
                          R$ {venda.valor_total.toFixed(2)}
                        </div>
                        <div className="text-gray-500">
                          Unit: R$ {venda.valor_unitario.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell p-2">
                      <div className="flex items-center space-x-1">
                        {getPaymentIcon(venda.forma_pagamento)}
                        <span className="text-xs">{getPaymentLabel(venda.forma_pagamento)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-2 text-xs">
                      {venda.nsu || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-2 text-xs">
                      {venda.numero_autorizacao || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell p-2">
                      {venda.bandeira ? (
                        <Badge className={getBandeiraColor(venda.bandeira)}>
                          {venda.bandeira.toUpperCase()}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell p-2">
                      <div className="text-xs">
                        <div className="font-medium">{venda.terminais?.nome || 'Terminal não encontrado'}</div>
                        <div className="text-gray-500 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{venda.terminais?.localizacao || 'Local não informado'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell p-2">
                      <div className="text-xs">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(venda.data_venda).toLocaleTimeString('pt-BR')}</span>
                        </div>
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
  );
};

export default VendaProdutoHistorico;
