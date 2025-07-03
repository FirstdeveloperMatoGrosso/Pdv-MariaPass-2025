// Teste de variáveis de ambiente
export function logEnvVars() {
  console.log('Variáveis de ambiente carregadas:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Não encontrada');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não encontrada');
  
  if (import.meta.env.VITE_SUPABASE_URL) {
    try {
      new URL(import.meta.env.VITE_SUPABASE_URL);
      console.log('✅ Formato da URL do Supabase é válido');
    } catch (e) {
      console.error('❌ Formato da URL do Supabase é inválido:', import.meta.env.VITE_SUPABASE_URL);
    }
  }
}
