import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas corretamente');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addStatusColumn() {
  try {
    console.log('Verificando se a coluna status já existe...');
    
    // Verifica se a coluna já existe
    const { data: columnExists, error: checkError } = await supabase
      .rpc('column_exists', {
        table_name: 'vendas_pulseiras',
        column_name: 'status'
      });

    if (checkError) {
      console.error('Erro ao verificar coluna:', checkError);
      return;
    }

    if (columnExists) {
      console.log('A coluna status já existe na tabela vendas_pulseiras');
      return;
    }

    console.log('Adicionando coluna status à tabela vendas_pulseiras...');
    
    // Adiciona a coluna status
    const { data: alterResult, error: alterError } = await supabase
      .rpc('add_status_column_to_vendas_pulseiras');

    if (alterError) {
      console.error('Erro ao adicionar coluna:', alterError);
      return;
    }

    console.log('Coluna status adicionada com sucesso!');
    
  } catch (error) {
    console.error('Erro inesperado:', error);
  }
}

// Executa a função
addStatusColumn();
