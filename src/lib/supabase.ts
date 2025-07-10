import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    secureFetch: typeof secureFetch;
  }
}

// Carrega as variáveis de ambiente de forma compatível com Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de ambiente
const isProduction = import.meta.env.PROD;

// Validação das credenciais
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Erro: Credenciais do Supabase não encontradas. Verifique seu arquivo .env';
  console.error(errorMsg);
  if (!isProduction) {
    console.error('Em desenvolvimento, você precisa configurar as variáveis de ambiente:');
    console.error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  }
  throw new Error(errorMsg);
}

// Função para requisições seguras
const secureFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// Cria uma única instância do cliente Supabase
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

const createSupabaseClientInstance = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: !isProduction,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'mariapass-web',
        },
      },
    });

    // Adiciona o método secureFetch à instância do Supabase
    (supabaseInstance as any).secureFetch = secureFetch;
  }
  
  return supabaseInstance;
};

const supabase = createSupabaseClientInstance();

export { supabase };

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
