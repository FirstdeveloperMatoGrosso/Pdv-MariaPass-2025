
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
      
      console.log('=== SALVANDO E BUSCANDO PRODUTOS VENDIDOS ===');
      console.log('Período:', periodo);
      console.log('Data início:', inicio);
      console.log('Data fim:', fim);

      // Salvar produtos vendidos usando a função SQL
      const { error: errorSalvar } = await supabase.rpc('salvar_produtos_vendidos', {
        data_inicio: inicio,
        data_fim: fim,
        periodo_tipo: periodo === 'today' ? 'dia' : periodo === 'week' ? 'semana' : 'mes'
      });

      if (errorSalvar) {
        console.error('Erro ao salvar produtos vendidos:', errorSalvar);
        throw errorSalvar;
      }

      console.log('Produtos vendidos salvos com sucesso!');

      // Buscar dados do relatório usando a função SQL
      const { data: dadosRelatorio, error: errorRelatorio } = await supabase.rpc('calcular_relatorio_vendas', {
        data_inicio: inicio,
        data_fim: fim
      });

      if (errorRelatorio) {
        console.error('Erro ao calcular relatório:', errorRelatorio);
        throw errorRelatorio;
      }

      console.log('Dados do relatório:', dadosRelatorio);

      // Buscar produtos mais vendidos da tabela salva
      const { data: produtosSalvos, error: errorProdutos } = await supabase
        .from('produtos_mais_vendidos')
        .select(`
          id,
          nome_produto,
          quantidade_vendida,
          receita_gerada,
          posicao_ranking
        `)
        .order('posicao_ranking', { ascending: true });

      if (errorProdutos) {
        console.error('Erro ao buscar produtos mais vendidos:', errorProdutos);
        throw errorProdutos;
      }

      console.log('Produtos mais vendidos salvos:', produtosSalvos);

      // Buscar vendas com débito de pulseira para pedidos recentes
      const { data: vendasPulseira, error: errorVendasPulseira } = await supabase
        .from('vendas_pulseiras')
        .select(`
          id,
          quantidade,
          valor_total,
          forma_pagamento,
          numero_autorizacao,
          data_venda
        `)
        .gte('data_venda', inicio)
        .lt('data_venda', fim)
        .in('forma_pagamento', ['debito_pulseira', 'Débito Pulseira'])
        .order('data_venda', { ascending: false })
        .limit(15);

      if (errorVendasPulseira) {
        console.error('Erro ao buscar vendas de pulseira:', errorVendasPulseira);
        throw errorVendasPulseira;
      }

      console.log('Vendas com débito de pulseira encontradas:', vendasPulseira?.length || 0);

      // Processar dados do relatório
      const dadosProcessados = dadosRelatorio?.[0] || {
        faturamento_total: 0,
        pedidos_realizados: 0,
        ticket_medio: 0
      };

      // Processar produtos mais vendidos
      const produtosProcessados = produtosSalvos?.map(produto => ({
        id: produto.id,
        nome: produto.nome_produto,
        quantidade: produto.quantidade_vendida,
        receita: Number(produto.receita_gerada)
      })) || [];

      // Processar pedidos recentes
      const pedidosProcessados = vendasPulseira?.map(venda => ({
        id: venda.id,
        numeroAutorizacao: venda.numero_autorizacao || `PULS-${venda.id.slice(0, 8)}`,
        dataVenda: venda.data_venda,
        quantidade: Number(venda.quantidade) || 1,
        valorTotal: Number(venda.valor_total) || 0,
        formaPagamento: 'Débito Pulseira'
      })) || [];

      // Atualizar estados
      setDados({
        faturamentoTotal: Number(dadosProcessados.faturamento_total),
        pedidosRealizados: Number(dadosProcessados.pedidos_realizados),
        ticketMedio: Number(dadosProcessados.ticket_medio),
        crescimentoPercentual: 12.5
      });

      setProdutosMaisVendidos(produtosProcessados);
      setPedidosRecentes(pedidosProcessados);

      console.log('=== DADOS FINAIS ATUALIZADOS ===');
      console.log('Produtos salvos na tabela:', produtosProcessados.length);
      console.log('Vendas recentes com pulseira:', pedidosProcessados.length);

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
