
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Product {
  id: string;
  nome: string;
  preco: number;
  codigo_barras: string;
  categoria: string;
  estoque: number;
  status: string;
  imagem_url?: string;
}

interface ProductEditFormProps {
  product: Product;
  onSuccess?: () => void;
}

const ProductEditForm: React.FC<ProductEditFormProps> = ({ product, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: product.nome,
    preco: product.preco,
    codigo_barras: product.codigo_barras || '',
    categoria: product.categoria,
    estoque: product.estoque,
    status: product.status,
  });

  const queryClient = useQueryClient();

  const categories = ['Bebidas', 'Salgados', 'Sanduíches', 'Doces', 'Outros'];

  const updateProductMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Atualizando produto:', product.id, data);
      const { error } = await supabase
        .from('produtos')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);
      
      if (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto atualizado com sucesso!');
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.categoria || formData.preco <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    updateProductMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-6 w-6 p-0">
          <Edit className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="nome" className="text-xs">Nome do Produto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className="h-7 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="categoria" className="text-xs">Categoria *</Label>
            <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="preco" className="text-xs">Preço *</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco}
                onChange={(e) => handleInputChange('preco', parseFloat(e.target.value) || 0)}
                className="h-7 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="estoque" className="text-xs">Estoque</Label>
              <Input
                id="estoque"
                type="number"
                min="0"
                value={formData.estoque}
                onChange={(e) => handleInputChange('estoque', parseInt(e.target.value) || 0)}
                className="h-7 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="codigo_barras" className="text-xs">Código de Barras</Label>
            <Input
              id="codigo_barras"
              value={formData.codigo_barras}
              onChange={(e) => handleInputChange('codigo_barras', e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="status" className="text-xs">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="h-7 text-xs"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateProductMutation.isPending}
              className="h-7 text-xs"
            >
              {updateProductMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditForm;
