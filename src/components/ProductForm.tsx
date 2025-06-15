
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Plus, Upload, Link } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

interface ProductFormData {
  nome: string;
  preco: number;
  codigo_barras: string;
  categoria: string;
  estoque: number;
  imagem_url?: string;
}

interface ProductFormProps {
  onSuccess?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [imageType, setImageType] = useState<'url' | 'upload'>('url');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const queryClient = useQueryClient();

  const categories = ['Bebidas', 'Salgados', 'Sanduíches', 'Doces', 'Outros'];

  const form = useForm<ProductFormData>({
    defaultValues: {
      nome: '',
      preco: 0,
      codigo_barras: '',
      categoria: 'Bebidas',
      estoque: 0,
      imagem_url: '',
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      console.log('Criando produto:', productData);
      
      let finalImageUrl = productData.imagem_url;

      // Se foi feito upload de arquivo, fazer upload para o Supabase Storage
      if (uploadedFile && imageType === 'upload') {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('produtos')
          .upload(fileName, uploadedFile);

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          throw new Error('Erro ao fazer upload da imagem: ' + uploadError.message);
        }

        // Obter URL pública da imagem
        const { data: { publicUrl } } = supabase.storage
          .from('produtos')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('produtos')
        .insert([{
          ...productData,
          imagem_url: finalImageUrl
        }]);
      
      if (error) {
        console.error('Erro ao criar produto:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto criado com sucesso!');
      form.reset();
      setPreviewUrl('');
      setUploadedFile(null);
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUrlChange = (url: string) => {
    form.setValue('imagem_url', url);
    setPreviewUrl(url);
  };

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o nome do produto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <select 
                      {...field}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estoque"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      placeholder="0"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codigo_barras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o código de barras" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seção de Imagem */}
            <div className="space-y-2">
              <Label>Imagem do Produto</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={imageType === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageType('url')}
                >
                  <Link className="w-4 h-4 mr-1" />
                  URL
                </Button>
                <Button
                  type="button"
                  variant={imageType === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageType('upload')}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </div>

              {imageType === 'url' ? (
                <Input
                  placeholder="Cole a URL da imagem aqui"
                  value={form.watch('imagem_url') || ''}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              )}

              {previewUrl && (
                <div className="mt-2">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createProductMutation.isPending} className="flex-1">
                {createProductMutation.isPending ? 'Criando...' : 'Criar Produto'}
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

export default ProductForm;
