
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CategoryFormData {
  nome: string;
  descricao: string;
}

interface CategoryFormProps {
  onSuccess?: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    defaultValues: {
      nome: '',
      descricao: ''
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: CategoryFormData) => {
      console.log('Criando categoria:', categoryData);
      
      // Garantir que os dados estão no formato correto
      const dataToInsert = {
        nome: categoryData.nome.trim(),
        descricao: categoryData.descricao?.trim() || null
      };

      console.log('Dados para inserir:', dataToInsert);
      
      const { data, error } = await supabase
        .from('categorias')
        .insert([dataToInsert])
        .select(); // Adicionar select para retornar os dados inseridos
      
      if (error) {
        console.error('Erro ao criar categoria:', error);
        throw error;
      }
      
      console.log('Categoria criada com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Categoria criada com sucesso!');
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria: ' + error.message);
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    // Validar se o nome não está vazio
    if (!data.nome.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }
    
    createCategoryMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Categoria</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              rules={{ 
                required: 'Nome da categoria é obrigatório',
                minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o nome da categoria" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite a descrição da categoria" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={createCategoryMutation.isPending} className="flex-1">
                {createCategoryMutation.isPending ? 'Criando...' : 'Criar Categoria'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
