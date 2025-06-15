

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
}

interface PedidoRecente {
  id: string;
  numeroAutorizacao: string;
  dataVenda: string;
  quantidade: number;
  valorTotal: number;
  formaPagamento: string;
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
      
      console.log('=== BUSCANDO TODOS OS PRODUTOS VENDIDOS ===');
      console.log('Período:', periodo);
      console.log('Data início:', inicio);
      console.log('Data fim:', fim);

      // Buscar TODAS as vendas de produtos com join para garantir que temos os dados do produto
      const { data: vendasProdutos, error: errorVendasProdutos } = await supabase
        .from('vendas_pulseiras')
        .select(`
          id,
          produto_id,
          quantidade,
          valor_unitario,
          valor_total,
          forma_pagamento,
          numero_autorizacao,
          data_venda,
          produtos!inner(
            id,
            nome
          )
        `)
        .gte('data_venda', inicio)
        .lt('data_venda', fim)
        .not('produto_id', 'is', null)
        .order('data_venda', { ascending: false });

      if (errorVendasProdutos) {
        console.error('Erro ao buscar vendas de produtos:', errorVendasProdutos);
        throw errorVendasProdutos;
      }

      console.log('Total de vendas de produtos encontradas:', vendasProdutos?.length || 0);
      console.log('Vendas de produtos completas:', vendasProdutos);
      
      // Calcular dados consolidados
      const faturamentoTotal = vendasProdutos?.reduce((total, venda) => {
        const valor = Number(venda.valor_total) || 0;
        return total + valor;
      }, 0) || 0;
      
      const pedidosRealizados = vendasProdutos?.length || 0;
      const ticketMedio = pedidosRealizados > 0 ? faturamentoTotal / pedidosRealizados : 0;

      console.log('Dados calculados:');
      console.log('- Faturamento total:', faturamentoTotal);
      console.log('- Pedidos realizados:', pedidosRealizados);
      console.log('- Ticket médio:', ticketMedio);

      // Agrupar todos os produtos vendidos
      const produtosGrouped = vendasProdutos?.reduce((acc: any, venda: any) => {
        if (!venda.produto_id || !venda.produtos?.nome) {
          console.warn('Venda sem produto válido ignorada:', venda);
          return acc;
        }

        const produtoId = venda.produto_id;
        const nomeProduto = venda.produtos.nome;
        
        if (!acc[produtoId]) {
          acc[produtoId] = {
            id: produtoId,
            nome: nomeProduto,
            quantidade: 0,
            receita: 0
          };
        }
        
        acc[produtoId].quantidade += Number(venda.quantidade) || 0;
        acc[produtoId].receita += Number(venda.valor_total) || 0;
        
        return acc;
      }, {}) || {};

      // Converter para array e ordenar por quantidade vendida
      const produtosVendidosArray = Object.values(produtosGrouped)
        .sort((a: any, b: any) => b.quantidade - a.quantidade);

      console.log('TODOS os produtos vendidos agrupados:', produtosVendidosArray);

      // Processar pedidos recentes - APENAS vendas com débito de pulseira
      const vendasComDebitoPulseira = vendasProdutos?.filter((venda: any) => 
        venda.forma_pagamento === 'debito_pulseira' || venda.forma_pagamento === 'Débito Pulseira'
      ) || [];

      console.log('Vendas com débito de pulseira encontradas:', vendasComDebitoPulseira.length);
      console.log('Vendas filtradas:', vendasComDebitoPulseira);

      const pedidosRecentesProcessados = vendasComDebitoPulseira.slice(0, 15).map((venda: any) => ({
        id: venda.id,
        numeroAutorizacao: venda.numero_autorizacao || `PULS-${venda.id.slice(0, 8)}`,
        dataVenda: venda.data_venda,
        quantidade: Number(venda.quantidade) || 1,
        valorTotal: Number(venda.valor_total) || 0,
        formaPagamento: 'Débito Pulseira'
      }));

      console.log('Pedidos recentes de pulseira processados:', pedidosRecentesProcessados);

      // Atualizar estados
      setDados({
        faturamentoTotal,
        pedidosRealizados,
        ticketMedio,
        crescimentoPercentual: 12.5
      });

      setProdutosMaisVendidos(produtosVendidosArray as ProdutoMaisVendido[]);
      setPedidosRecentes(pedidosRecentesProcessados);

      console.log('=== DADOS FINAIS ATUALIZADOS ===');
      console.log('Total de produtos diferentes vendidos:', produtosVendidosArray.length);
      console.log('Total de vendas recentes com pulseira:', pedidosRecentesProcessados.length);

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

    // Configurar subscription para mudanças na tabela vendas_pulseiras
    const channel = supabase
      .channel('vendas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendas_pulseiras'
        },
        (payload) => {
          console.log('Mudança detectada na tabela vendas_pulseiras:', payload);
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

