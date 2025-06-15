
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Cancelamento {
  id: string;
  pedido_id?: string;
  numero_pedido?: string;
  cliente_nome?: string;
  produto_nome?: string;
  valor_cancelado: number;
  motivo: string;
  observacoes?: string;
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
}

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
      const novoCancelamento = {
        numero_pedido: dadosCancelamento.numero_pedido,
        cliente_nome: dadosCancelamento.cliente_nome || 'Cliente Totem',
        produto_nome: dadosCancelamento.produto_nome || 'Produto não especificado',
        valor_cancelado: dadosCancelamento.valor_cancelado || 0,
        motivo: dadosCancelamento.motivo,
        observacoes: dadosCancelamento.observacoes,
        responsavel: 'Sistema',
        operador: 'Totem',
        aprovado: false,
        data_cancelamento: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('cancelamentos')
        .insert([novoCancelamento])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cancelamento:', error);
        throw error;
      }

      console.log('Cancelamento criado:', data);
      toast.success('Solicitação de cancelamento criada com sucesso!');
      
      // Atualizar lista local
      setCancelamentos(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Erro ao criar cancelamento:', err);
      toast.error('Erro ao criar solicitação de cancelamento');
      throw err;
    }
  };

  const atualizarStatusCancelamento = async (id: string, aprovado: boolean) => {
    try {
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
    atualizarStatusCancelamento,
    refetch: buscarCancelamentos
  };
};
