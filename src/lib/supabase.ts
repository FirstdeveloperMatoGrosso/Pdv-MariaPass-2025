import { createClient } from '@supabase/supabase-js';

// Carrega as variáveis de ambiente de forma compatível com Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Função para validar URL
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Valores padrão para desenvolvimento
const defaultSupabaseUrl = 'https://dummy-url.supabase.co';
const defaultAnonKey = 'dummy-key';

// Verifica se as credenciais são válidas
const hasValidCredentials = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl);

if (!hasValidCredentials) {
  console.warn('Atenção: Credenciais do Supabase não configuradas ou inválidas. Usando valores padrão.');
  console.log('VITE_SUPABASE_URL:', supabaseUrl || 'não definido');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' : 'não definido');
}

// Remove a barra final da URL, se existir
const formattedUrl = (hasValidCredentials ? supabaseUrl : defaultSupabaseUrl).replace(/\/+$/, '');

// Cria o cliente Supabase
export const supabase = createClient(formattedUrl, hasValidCredentials ? supabaseAnonKey : defaultAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Tipos para as tabelas do Supabase
export type Tables = {
  clientes: {
    Row: {
      id: string;
      nome: string;
      email: string | null;
      documento: string;
      telefone: string | null;
      tipo: 'PF' | 'PJ';
      endereco: {
        cep?: string;
        logradouro?: string;
        numero?: string;
        complemento?: string;
        bairro?: string;
        cidade?: string;
        uf?: string;
      } | null;
      data_cadastro: string;
      ativo: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      nome: string;
      email?: string | null;
      documento: string;
      telefone?: string | null;
      tipo: 'PF' | 'PJ';
      endereco?: {
        cep?: string;
        logradouro?: string;
        numero?: string;
        complemento?: string;
        bairro?: string;
        cidade?: string;
        uf?: string;
      } | null;
      data_cadastro?: string;
      ativo?: boolean;
    };
    Update: {
      nome?: string;
      email?: string | null;
      documento?: string;
      telefone?: string | null;
      tipo?: 'PF' | 'PJ';
      endereco?: {
        cep?: string;
        logradouro?: string;
        numero?: string;
        complemento?: string;
        bairro?: string;
        cidade?: string;
        uf?: string;
      } | null;
      ativo?: boolean;
      updated_at?: string;
    };
  };
};

// Tipos úteis para uso nos componentes
export type Cliente = Tables['clientes']['Row'];
export type NovoCliente = Tables['clientes']['Insert'];
export type AtualizarCliente = Tables['clientes']['Update'];
