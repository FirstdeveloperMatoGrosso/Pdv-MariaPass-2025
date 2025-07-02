
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VendaPulseira } from '@/types/venda';

interface Cancelamento {
  id: string;
  pedido_id?: string;
  numero_pedido?: string;
  cliente_nome?: string;
  produto_nome?: string;
  valor_cancelado: number;
  motivo: string;
  observacoes?: string;
  codigo_autorizacao?: string;
  responsavel: string;
  operador?: string;
  aprovado: boolean;
  data_cancelamento: string;
}

interface NovoCancelamento {
  numero_pedido: string;
  motivo: string;
  valor_cancelado?: number;
  cliente_nome?: string;
  produto_nome?: string;
  observacoes?: string;
  codigo_autorizacao?: string;
}

export const buscarCancelamentoPorPedido = async (numeroPedido: string) => {
  try {
    const { data, error } = await supabase
      .from('cancelamentos')
      .select('*')
      .eq('numero_pedido', numeroPedido)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar cancelamento:', error);
    throw error;
  }
};

export const useCancelamentos = () => {
  const [cancelamentos, setCancelamentos] = useState<Cancelamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarCancelamentos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('cancelamentos')
        .select('*')
        .order('data_cancelamento', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cancelamentos:', error);
        throw error;
      }

      console.log('Cancelamentos carregados:', data);
      setCancelamentos(data || []);
    } catch (err) {
      console.error('Erro ao carregar cancelamentos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar cancelamentos');
    } finally {
      setLoading(false);
    }
  };

  const criarCancelamento = async (dadosCancelamento: NovoCancelamento) => {
    try {
      // Primeiro, buscar o ID do pedido usando o número do pedido
      const { data: pedido, error: erroPedido } = await supabase
        .from('pedidos')
        .select('id')
        .eq('numero_pedido', dadosCancelamento.numero_pedido)
        .single();

      if (erroPedido || !pedido) {
        console.error('Erro ao buscar pedido:', erroPedido);
        throw new Error('Pedido não encontrado');
      }

      // Usando apenas as colunas que existem na tabela
      const novoCancelamento = {
        pedido_id: pedido.id, // Usando o ID real do pedido
        motivo: dadosCancelamento.motivo,
        valor_cancelado: dadosCancelamento.valor_cancelado || 0,
        responsavel: 'Sistema',
        observacoes: `Nº Pedido: ${dadosCancelamento.numero_pedido}. ` +
                    `Cliente: ${dadosCancelamento.cliente_nome || 'Não informado'}. ` +
                    `Produto: ${dadosCancelamento.produto_nome || 'Não especificado'}. ` +
                    `Código: ${dadosCancelamento.codigo_autorizacao || 'N/A'}. ` +
                    (dadosCancelamento.observacoes ? `Obs: ${dadosCancelamento.observacoes}` : ''),
        aprovado: true,
        data_cancelamento: new Date().toISOString()
      };

      // 1. Primeiro, verifica se já existe um cancelamento para esta venda
      const { data: cancelamentoExistente } = await supabase
        .from('cancelamentos')
        .select('*')
        .eq('pedido_id', pedido.id) // Usar o ID do pedido
        .maybeSingle();

      if (cancelamentoExistente) {
        throw new Error('Já existe um cancelamento para esta venda');
      }

      // 2. Cria o registro de cancelamento
      const { data: cancelamento, error: erroCancelamento } = await supabase
        .from('cancelamentos')
        .insert([novoCancelamento])
        .select()
        .single();

      if (erroCancelamento) {
        console.error('Erro ao criar cancelamento:', erroCancelamento);
        throw erroCancelamento;
      }

      // Atualiza o status do pedido para 'cancelado' no banco de dados
      try {
        // Tenta atualizar o status do pedido
        const { error: erroAtualizacao } = await supabase
          .from('pedidos')
          .update({ 
            status: 'cancelado',
            updated_at: new Date().toISOString() 
          })
          .eq('id', pedido.id); // Usar o ID do pedido

        if (erroAtualizacao) {
          console.warn('Aviso: Não foi possível atualizar o status do pedido:', erroAtualizacao);
          
          // Se a coluna status não existir, apenas registra o aviso
          if (erroAtualizacao.code === '42703') {
            console.warn('A coluna "status" não existe na tabela "pedidos". Execute o script SQL para adicioná-la.');
          }
        }
      } catch (error) {
        console.error('Erro ao tentar atualizar o status da venda:', error);
        // Continua mesmo com erro para não interromper o fluxo principal
      }

      console.log('Cancelamento criado e venda atualizada:', cancelamento);
      toast.success('Venda cancelada com sucesso!');
      
      // Atualizar lista local
      setCancelamentos(prev => [cancelamento, ...prev]);
      
      return cancelamento;
    } catch (err) {
      console.error('Erro ao criar cancelamento:', err);
      toast.error('Erro ao criar solicitação de cancelamento');
      throw err;
    }
  };

  const atualizarStatusCancelamento = async (id: string, aprovado: boolean) => {
    try {
      // Primeiro, obtém os dados atuais do cancelamento
      const { data: cancelamentoAtual, error: erroBusca } = await supabase
        .from('cancelamentos')
        .select('*')
        .eq('id', id)
        .single();

      if (erroBusca) {
        console.error('Erro ao buscar cancelamento:', erroBusca);
        throw erroBusca;
      }

      // Atualiza o status do cancelamento
      const { data, error } = await supabase
        .from('cancelamentos')
        .update({ 
          aprovado,
          operador: 'Admin'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cancelamento:', error);
        throw error;
      }

      console.log('Status do cancelamento atualizado:', data);
      
      // Se o cancelamento foi aprovado, atualiza o status do pedido para 'cancelado'
      if (aprovado && cancelamentoAtual?.numero_pedido) {
        try {
          const { error: erroAtualizacao } = await supabase
            .from('pedidos')
            .update({ 
              status: 'cancelado',
              updated_at: new Date().toISOString() 
            })
            .eq('numero_pedido', cancelamentoAtual.numero_pedido);

          if (erroAtualizacao) {
            console.warn('Aviso: Não foi possível atualizar o status do pedido:', erroAtualizacao);
          }
        } catch (error) {
          console.error('Erro ao atualizar status da venda:', error);
          // Continua mesmo com erro para não interromper o fluxo principal
        }
      }
      
      // Atualizar lista local
      setCancelamentos(prev => 
        prev.map(cancelamento => 
          cancelamento.id === id 
            ? { ...cancelamento, aprovado, operador: 'Admin' }
            : cancelamento
        )
      );

      toast.success(`Cancelamento ${aprovado ? 'aprovado' : 'rejeitado'} com sucesso!`);
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar status do cancelamento:', err);
      toast.error('Erro ao atualizar status do cancelamento');
      throw err;
    }
  };

  useEffect(() => {
    buscarCancelamentos();
  }, []);

  return {
    cancelamentos,
    loading,
    error,
    criarCancelamento,
    buscarCancelamentos,
    buscarCancelamentoPorPedido,
    atualizarStatusCancelamento,
    refetch: buscarCancelamentos
  };
};
