import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Cliente } from '@/lib/supabase';

export const useClientes = (searchTerm = '', page = 1, itemsPerPage = 10) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadClientes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' });

      // Aplicar filtro de busca se houver termo
      if (searchTerm) {
        query = query.or(
          `nome.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      // Aplicar paginação
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error: queryError, count } = await query
        .order('nome', { ascending: true })
        .range(from, to);

      if (queryError) throw queryError;

      setClientes(data || []);
      setTotal(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar clientes. Tente novamente mais tarde.');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar clientes quando o termo de busca ou a página mudar
  useEffect(() => {
    loadClientes();
  }, [searchTerm, page]);

  return {
    clientes,
    loading,
    error,
    total,
    totalPages,
    refresh: loadClientes
  };
};

export const useClientePorId = (id?: string) => {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const carregarCliente = async (clienteId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (queryError) throw queryError;
      setCliente(data);
    } catch (err) {
      console.error('Erro ao carregar cliente:', err);
      setError('Erro ao carregar cliente. Tente novamente mais tarde.');
      setCliente(null);
    } finally {
      setLoading(false);
    }
  };

  // Carregar cliente quando o ID mudar
  useEffect(() => {
    if (id) {
      carregarCliente(id);
    } else {
      setCliente(null);
      setLoading(false);
    }
  }, [id]);

  return {
    cliente,
    loading,
    error,
    carregarCliente
  };
};
