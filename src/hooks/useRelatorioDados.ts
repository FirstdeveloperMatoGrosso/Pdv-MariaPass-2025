
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DadosRelatorio {
  faturamentoTotal: number;
  pedidosRealizados: number;
  ticketMedio: number;
  crescimentoPercentual: number;
}

interface ProdutoMaisVendido {
  id: string;
  nome: string;
  quantidade: number;
  receita: number;
  imagem_url?: string;
}

interface PedidoRecente {
  id: string;
  numeroAutorizacao: string;
  dataVenda: string;
  quantidade: number;
  valorTotal: number;
  formaPagamento: string;
  produtoNome?: string;
  produtoImagem?: string;
}

export const useRelatorioDados = (periodo: 'today' | 'week' | 'month') => {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([]);
  const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = () => {
    const now = new Date();
    
    switch (periodo) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          inicio: today.toISOString(),
          fim: tomorrow.toISOString()
        };
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(now);
        weekEnd.setHours(23, 59, 59, 999);
        return {
          inicio: weekStart.toISOString(),
          fim: weekEnd.toISOString()
        };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(now);
        monthEnd.setHours(23, 59, 59, 999);
        return {
          inicio: monthStart.toISOString(),
          fim: monthEnd.toISOString()
        };
      default:
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const defaultEnd = new Date(defaultStart);
        defaultEnd.setDate(defaultEnd.getDate() + 1);
        return {
          inicio: defaultStart.toISOString(),
          fim: defaultEnd.toISOString()
        };
    }
  };

  const buscarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { inicio, fim } = getDateRange();
      
      console.log('=== BUSCANDO DADOS DE RELATÓRIO ===');
      console.log('Período:', periodo);
      console.log('Data início:', inicio);
      console.log('Data fim:', fim);

      // Buscar dados do relatório
      const { data: dadosRelatorio, error: errorRelatorio } = await supabase.rpc('calcular_relatorio_vendas', {
        data_inicio: inicio,
        data_fim: fim
      });

      if (errorRelatorio) {
        console.error('Erro ao calcular relatório:', errorRelatorio);
        throw errorRelatorio;
      }

      console.log('Dados do relatório:', dadosRelatorio);

      // Buscar TODOS os produtos vendidos diretamente da tabela itens_pedido com JOIN em produtos
      const { data: itensVendidos, error: errorProdutos } = await supabase
        .from('itens_pedido')
        .select(`
          id,
          quantidade,
          preco_unitario,
          subtotal,
          pedido_id,
          produto:produtos(
            id,
            nome,
            imagem_url
          ),
          pedido:pedidos!inner(
            data_pedido,
            status
          )
        `)
        .gte('pedido.data_pedido', inicio)
        .lt('pedido.data_pedido', fim)
        .not('produto_id', 'is', null);

      if (errorProdutos) {
        console.error('Erro ao buscar produtos vendidos:', errorProdutos);
        setProdutosMaisVendidos([]);
      } else {
        console.log('Itens vendidos encontrados:', itensVendidos?.length || 0);
        
        // Processar dados para agrupar por produto
        const produtosAgrupados = itensVendidos?.reduce((acc: any, item: any) => {
          if (item.produto && item.produto.id) {
            const produtoId = item.produto.id;
            if (!acc[produtoId]) {
              acc[produtoId] = {
                id: produtoId,
                nome: item.produto.nome,
                imagem_url: item.produto.imagem_url,
                quantidade: 0,
                receita: 0
              };
            }
            acc[produtoId].quantidade += Number(item.quantidade) || 0;
            acc[produtoId].receita += Number(item.subtotal) || 
              (Number(item.quantidade) * Number(item.preco_unitario)) || 0;
          }
          return acc;
        }, {}) || {};

        const produtosArray = Object.values(produtosAgrupados) as ProdutoMaisVendido[];
        const produtosOrdenados = produtosArray.sort((a: any, b: any) => b.quantidade - a.quantidade);
        
        console.log('Produtos agrupados e ordenados:', produtosOrdenados);
        setProdutosMaisVendidos(produtosOrdenados);
      }

      // Buscar pedidos recentes com informações dos itens e produtos
      const { data: pedidosRecentes, error: errorVendas } = await supabase
        .from('pedidos')
        .select(`
          id,
          numero_pedido,
          data_pedido,
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
        .gte('data_pedido', inicio)
        .lt('data_pedido', fim)
        .order('data_pedido', { ascending: false })
        .limit(15);

      if (errorVendas) {
        console.error('Erro ao buscar vendas recentes:', errorVendas);
        setPedidosRecentes([]);
      } else {
        console.log('Vendas recentes encontradas:', pedidosRecentes?.length || 0);
        
        // Processar pedidos recentes
        const pedidosProcessados = pedidosRecentes?.flatMap(pedido => {
          // Se não houver itens, retorna um pedido vazio
          if (!pedido.itens || pedido.itens.length === 0) {
            return [{
              id: pedido.id,
              numeroAutorizacao: pedido.numero_pedido || `PED-${pedido.id.slice(0, 8)}`,
              dataVenda: pedido.data_pedido,
              quantidade: 0,
              valorTotal: Number(pedido.valor_total) || 0,
              formaPagamento: pedido.tipo_pagamento || 'Não informado',
              produtoNome: 'Nenhum item',
              produtoImagem: undefined
            }];
          }
          
          // Para cada item, cria uma entrada no array de pedidos processados
          return pedido.itens.map(item => ({
            id: `${pedido.id}-${item.produto?.id || '0'}`,
            numeroAutorizacao: pedido.numero_pedido || `PED-${pedido.id.slice(0, 8)}`,
            dataVenda: pedido.data_pedido,
            quantidade: Number(item.quantidade) || 1,
            valorTotal: Number(item.subtotal) || (Number(item.quantidade) * Number(item.preco_unitario)) || 0,
            formaPagamento: pedido.tipo_pagamento || 'Não informado',
            produtoNome: item.produto?.nome || 'Produto não identificado',
            produtoImagem: item.produto?.imagem_url || undefined
          }));
        }) || [];
        setPedidosRecentes(pedidosProcessados);
      }

      // Processar dados do relatório
      const dadosProcessados = dadosRelatorio?.[0] || {
        faturamento_total: 0,
        pedidos_realizados: 0,
        ticket_medio: 0
      };

      setDados({
        faturamentoTotal: Number(dadosProcessados.faturamento_total),
        pedidosRealizados: Number(dadosProcessados.pedidos_realizados),
        ticketMedio: Number(dadosProcessados.ticket_medio),
        crescimentoPercentual: 12.5
      });

      console.log('=== DADOS FINAIS ATUALIZADOS ===');
      console.log('Produtos vendidos:', produtosMaisVendidos.length);
      console.log('Pedidos recentes:', pedidosRecentes.length);

    } catch (err) {
      console.error('Erro ao carregar dados do relatório:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    console.log('Hook useRelatorioDados iniciado para período:', periodo);
    
    // Buscar dados iniciais
    buscarDados();

    // Configurar subscription para mudanças na tabela pedidos
    const channel = supabase
      .channel('pedidos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('Mudança detectada na tabela de pedidos:', payload);
          // Recarregar dados quando houver mudanças
          setTimeout(() => buscarDados(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [periodo]);

  return {
    dados,
    produtosMaisVendidos,
    pedidosRecentes,
    loading,
    error,
    refetch: buscarDados
  };
};
