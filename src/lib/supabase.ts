import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Verificação de ambiente
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    secureFetch: typeof secureFetch;
  }
}

import { config } from '@/config/env';

// Carrega as variáveis de ambiente de forma segura
const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

// Verificação de ambiente (compatível com Node.js e navegador)
const isProduction = typeof process !== 'undefined' ? process.env.NODE_ENV === 'production' : 
  (typeof import.meta !== 'undefined' ? import.meta.env.PROD : false);

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
    // Configuração de armazenamento seguro que funciona tanto no navegador quanto no Node.js
    const storageAdapter = {
      getItem: (key: string) => {
        if (!isBrowser) {
          // No servidor, retorna null
          return null;
        }
        
        try {
          // Tenta obter do localStorage primeiro
          const item = localStorage.getItem(key);
          if (item) return item;
          
          // Se não encontrar, tenta obter do cookie
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${key}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        } catch (error) {
          console.error('Erro ao acessar armazenamento local:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        if (!isBrowser) return;
        
        try {
          // Salva no localStorage
          localStorage.setItem(key, value);
          
          // E também em um cookie seguro
          document.cookie = `${key}=${value}; path=/; secure; samesite=lax`;
        } catch (error) {
          console.error('Erro ao salvar no armazenamento local:', error);
        }
      },
      removeItem: (key: string) => {
        if (!isBrowser) return;
        
        try {
          // Remove do localStorage
          localStorage.removeItem(key);
          
          // Remove o cookie
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        } catch (error) {
          console.error('Erro ao remover do armazenamento local:', error);
        }
      }
    };

    const options = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: !isProduction,
        flowType: 'pkce' as const, // Garante que o tipo seja 'pkce' literal
        storage: storageAdapter
      },
      global: {
        headers: {
          'X-Client-Info': 'mariapass-web',
        },
      },
    };

    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, options);

    // Adiciona o método secureFetch à instância do Supabase
    (supabaseInstance as any).secureFetch = secureFetch;
    
    // Verifica a sessão ao inicializar (apenas no navegador)
    if (isBrowser) {
      supabaseInstance.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Dispara evento de atualização de autenticação
          window.dispatchEvent(new Event('auth:stateChange'));
        }
      });
      
      // Escuta mudanças na autenticação (apenas no navegador)
      supabaseInstance.auth.onAuthStateChange((event, session) => {
        // Dispara evento de atualização de autenticação
        window.dispatchEvent(new Event('auth:stateChange'));
      });
    }
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
      user_id: string;
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
      user_id?: string;
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
      user_id?: string;
      updated_at?: string;
    };
  };
};

// Tipos úteis para uso nos componentes
export type Cliente = Tables['clientes']['Row'];
export type NovoCliente = Tables['clientes']['Insert'];
export type AtualizarCliente = Tables['clientes']['Update'];
