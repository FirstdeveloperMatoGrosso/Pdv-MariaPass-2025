// Configuração de ambiente

interface Config {
  pagarme: {
    apiKey: string;
    secretKey: string;
    encryptionKey: string;
    apiUrl: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  pix: {
    expiresInMinutes: number;
  };
}

// Função para obter variáveis de ambiente de forma segura
function getEnvVar(key: string, defaultValue: string = ''): string {
  // No navegador (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  // No Node.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`VITE_${key}`] || process.env[key] || defaultValue;
  }
  return defaultValue;
}

export const config: Config = {
  pagarme: {
    // Chave de API do Pagar.me (em produção, use variáveis de ambiente)
    apiKey: getEnvVar('VITE_PAGARME_API_KEY', 'sk_test_bb42e0672450489fb186dd88a72d4b3c'),
    secretKey: getEnvVar('VITE_PAGARME_SECRET_KEY', 'sk_test_bb42e0672450489fb186dd88a72d4b3c'),
    encryptionKey: getEnvVar('VITE_PAGARME_ENCRYPTION_KEY', 'ek_test_123456789012345678901234567890123456'),
    // URL base da API do Pagar.me
    apiUrl: 'https://api.pagar.me/core/v5',
  },
  supabase: {
    // URL do seu projeto Supabase
    url: getEnvVar('VITE_SUPABASE_URL', ''),
    // Chave anônima do Supabase
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', '')
  },
  pix: {
    expiresInMinutes: 30, // Tempo de expiração do PIX em minutos
  },
};
