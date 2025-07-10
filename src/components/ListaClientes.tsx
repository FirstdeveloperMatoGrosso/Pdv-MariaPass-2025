import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  // Outros campos conforme sua tabela
};

export function ListaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usando a função secureFetch para buscar os clientes
      const data = await supabase.secureFetch('clientes');
      setClientes(data);
      
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar clientes. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const adicionarCliente = async (novoCliente: Omit<Cliente, 'id'>) => {
    try {
      setLoading(true);
      
      // Usando a função secureFetch para criar um novo cliente
      const data = await supabase.secureFetch('clientes', {
        method: 'POST',
        body: JSON.stringify(novoCliente)
      });
      
      // Atualiza a lista de clientes
      setClientes([...clientes, data]);
      
    } catch (err) {
      console.error('Erro ao adicionar cliente:', err);
      throw err; // Pode ser tratado pelo componente pai
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando clientes...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Lista de Clientes</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">E-mail</th>
              <th className="px-4 py-2 text-left">Telefone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{cliente.nome}</td>
                <td className="px-4 py-2">{cliente.email}</td>
                <td className="px-4 py-2">{cliente.telefone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button
        onClick={() => adicionarCliente({
          nome: 'Novo Cliente',
          email: 'email@exemplo.com',
          telefone: '(00) 00000-0000'
        })}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Adicionando...' : 'Adicionar Cliente de Exemplo'}
      </button>
    </div>
  );
}

export default ListaClientes;
