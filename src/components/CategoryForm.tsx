import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
interface CategoryFormData {
  nome: string;
  descricao: string;
}
interface CategoryFormProps {
  onSuccess?: () => void;
}
const CategoryForm: React.FC<CategoryFormProps> = ({
  onSuccess
}) => {
  const [open, setOpen] = useState(false);
  const form = useForm<CategoryFormData>({
    defaultValues: {
      nome: '',
      descricao: ''
    }
  });
  const onSubmit = (data: CategoryFormData) => {
    // Por enquanto apenas simula a criação da categoria
    console.log('Criando categoria:', data);
    toast.success('Categoria criada com sucesso!');
    form.reset();
    setOpen(false);
    onSuccess?.();
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2 text-zinc-100 bg-zinc-950 hover:bg-zinc-800">
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
            <FormField control={form.control} name="nome" render={({
            field
          }) => <FormItem>
                  <FormLabel>Nome da Categoria *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o nome da categoria" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="descricao" render={({
            field
          }) => <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite a descrição da categoria" />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Criar Categoria
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>;
};
export default CategoryForm;