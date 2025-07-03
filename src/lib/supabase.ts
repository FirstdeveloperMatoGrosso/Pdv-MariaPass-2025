import { createClient } from '@supabase/supabase-js';

// Verifica se as variáveis de ambiente estão configuradas
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não encontradas. Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'
  );
}

// Remove a barra final da URL, se existir
const formattedUrl = supabaseUrl.endsWith('/') 
  ? supabaseUrl.slice(0, -1) 
  : supabaseUrl;

// Valida o formato da URL
try {
  new URL(formattedUrl);
} catch (error) {
  throw new Error(`URL do Supabase inválida: ${formattedUrl}. Exemplo de formato correto: https://seu-projeto.supabase.co`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
