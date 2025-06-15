
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConfigItem {
  id: string;
  categoria: string;
  chave: string;
  valor: any;
  descricao: string;
}

export const useSystemConfig = (categoria?: string) => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = async () => {
    try {
      let query = supabase.from('configuracoes_sistema').select('*');
      
      if (categoria) {
        query = query.eq('categoria', categoria);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (chave: string, valor: any, categoria: string) => {
    try {
      console.log(`🔧 Salvando config: ${categoria}.${chave} = ${valor}`);
      
      // Usar upsert para inserir ou atualizar
      const { error } = await supabase
        .from('configuracoes_sistema')
        .upsert({ 
          categoria, 
          chave, 
          valor, 
          descricao: `Configuração ${chave} do ${categoria}`,
          updated_at: new Date().toISOString() 
        }, { 
          onConflict: 'categoria,chave' 
        });

      if (error) {
        console.error('❌ Erro ao salvar:', error);
        throw error;
      }
      
      console.log('✅ Configuração salva com sucesso!');
      await fetchConfigs();
      toast.success('Configuração atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
      throw error;
    }
  };

  const getConfigValue = (chave: string) => {
    const config = configs.find(c => c.chave === chave);
    return config?.valor;
  };

  useEffect(() => {
    fetchConfigs();
  }, [categoria]);

  return {
    configs,
    loading,
    updateConfig,
    getConfigValue,
    refetch: fetchConfigs
  };
};
