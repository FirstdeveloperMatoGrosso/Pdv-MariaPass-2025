
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Hash,
  DollarSign
} from 'lucide-react';
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

interface VendaProdutoHistoricoProps {
  produtoVendidoId: string;
  codigoProduto: string;
}

interface VendaHistorico {
  id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  forma_pagamento: string;
  numero_autorizacao: string | null;
  nsu: string | null;
  bandeira: string | null;
  data_venda: string;
  produtos?: {
    nome: string;
    codigo_barras: string | null;
  };
  terminais?: {
    nome: string;
    localizacao: string;
  };
}

const VendaProdutoHistorico: React.FC<VendaProdutoHistoricoProps> = ({ produtoVendidoId, codigoProduto }) => {
  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ['historico_pedidos', produtoVendidoId],
    queryFn: async () => {
      // Primeiro busca os itens de pedido
      const { data: itens, error: itensError } = await supabase
        .from('itens_pedido')
        .select('*')
        .eq('produto_vendido_id', produtoVendidoId)
        .order('created_at', { ascending: false });
      
      if (itensError) {
        console.error('Erro ao buscar itens do pedido:', itensError);
        throw itensError;
      }

      // Se não houver itens, retorna array vazio
      if (!itens || itens.length === 0) return [];

      try {
        // Busca os pedidos e produtos relacionados
        const pedidosIds = [...new Set(itens.map(item => item.pedido_id))];
        const produtosIds = [...new Set(itens.map(item => item.produto_id).filter(Boolean))];

        // Busca os pedidos
        const { data: pedidos = [], error: pedidosError } = await supabase
          .from('pedidos')
          .select('*')
          .in('id', pedidosIds);
        
        if (pedidosError) throw pedidosError;

        // Busca os produtos
        const { data: produtos = [], error: produtosError } = await supabase
          .from('produtos')
          .select('*')
          .in('id', produtosIds);
        
        if (produtosError) throw produtosError;

        // Cria um mapa de pedidos por ID para acesso rápido
        const pedidosMap = new Map(pedidos.map(p => [p.id, p]));
        
        // Cria um mapa de produtos por ID para acesso rápido
        const produtosMap = new Map(produtos.map(p => [p.id, p]));

        // Transforma os itens no formato esperado
        return itens.map(item => ({
          id: item.id,
          quantidade: item.quantidade,
          valor_unitario: item.preco_unitario,
          valor_total: item.subtotal,
          forma_pagamento: pedidosMap.get(item.pedido_id)?.tipo_pagamento || 'desconhecido',
          numero_autorizacao: pedidosMap.get(item.pedido_id)?.numero_pedido || null,
          nsu: null,
          bandeira: null,
          data_venda: pedidosMap.get(item.pedido_id)?.data_pedido || new Date().toISOString(),
          nome: produtosMap.get(item.produto_id)?.nome || 'Produto não identificado',
          codigo_barras: produtosMap.get(item.produto_id)?.codigo_barras || null,
          produtos: produtosMap.get(item.produto_id) ? {
            nome: produtosMap.get(item.produto_id)?.nome || '',
            codigo_barras: produtosMap.get(item.produto_id)?.codigo_barras || null
          } : undefined,
          terminais: {
            nome: 'Terminal',
            localizacao: 'Localização não especificada'
          }
        }));
      } catch (error) {
        console.error('Erro ao processar histórico de vendas:', error);
        throw error;
      }
    },
    enabled: !!produtoVendidoId,
  });

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
          <Badge variant="outline">{vendas.length} transações</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {vendas.length === 0 ? (
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
                {vendas.map((venda: VendaHistorico) => (
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
