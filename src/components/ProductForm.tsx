
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, Link } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

interface ProductFormData {
  nome: string;
  preco: number;
  codigo_barras: string;
  categoria: string;
  estoque: number;
  descricao: string;
  imagem_url?: string;
  tipo_venda: string;
  unidades_por_caixa?: number;
}

interface ProductFormProps {
  onSuccess?: () => void;
}

interface Category {
  id: string;
  nome: string;
  descricao: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [imageType, setImageType] = useState<'url' | 'upload'>('url');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const queryClient = useQueryClient();

  // Buscar categorias do Supabase com refetch automático
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      console.log('Buscando categorias para o formulário...');
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar categorias:', error);
        throw error;
      }
      
      console.log('Categorias carregadas no formulário:', data);
      return data as Category[];
    },
    staleTime: 30000, // Cache por 30 segundos
    refetchOnWindowFocus: true,
  });

  const form = useForm<ProductFormData>({
    defaultValues: {
      nome: '',
      preco: 0,
      codigo_barras: '',
      categoria: '',
      estoque: 0,
      descricao: '',
      imagem_url: '',
      tipo_venda: 'unidade',
      unidades_por_caixa: undefined,
    },
  });

  const tipoVenda = form.watch('tipo_venda');

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
          nome: productData.nome,
          preco: productData.preco,
          codigo_barras: productData.codigo_barras,
          categoria: productData.categoria,
          estoque: productData.estoque,
          descricao: productData.descricao,
          imagem_url: finalImageUrl,
          tipo_venda: productData.tipo_venda,
          unidades_por_caixa: productData.unidades_por_caixa
        }]);
      
      if (error) {
        console.error('Erro ao criar produto:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-totem'] });
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

  // Recarregar categorias quando o dialog for aberto
  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      console.log('Dialog aberto, recarregando categorias...');
      refetchCategories();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-1 text-xs h-7 px-2">
          <Plus className="w-3 h-3" />
          <span>Novo Produto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-sm md:max-w-md max-h-[95vh] overflow-y-auto p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm font-semibold">Adicionar Novo Produto</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Nome do Produto *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o nome do produto" required className="h-7 text-xs" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite a descrição do produto" className="h-7 text-xs" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Categoria *</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        console.log('Categoria selecionada:', value);
                        field.onChange(value);
                      }}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione uma categoria"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 && !categoriesLoading ? (
                          <SelectItem value="no-categories" disabled>
                            Nenhuma categoria encontrada
                          </SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.nome} className="text-xs">
                              {category.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-xs" />
                  {categories.length === 0 && !categoriesLoading && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Crie uma categoria primeiro usando o botão "Nova Categoria"
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_venda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tipo de Venda *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-3"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="unidade" id="unidade" className="w-3 h-3" />
                        <Label htmlFor="unidade" className="text-xs">Unidade</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="caixa" id="caixa" className="w-3 h-3" />
                        <Label htmlFor="caixa" className="text-xs">Caixa</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {tipoVenda === 'caixa' && (
              <FormField
                control={form.control}
                name="unidades_por_caixa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Unidades por Caixa *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="1"
                        placeholder="Ex: 12"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        required={tipoVenda === 'caixa'}
                        className="h-7 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="preco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Preço (R$) *
                      {tipoVenda === 'caixa' && ' - Por Caixa'}
                      {tipoVenda === 'unidade' && ' - Por Unidade'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        required
                        className="h-7 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estoque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Qtd Estoque *
                      {tipoVenda === 'caixa' && ' - Caixas'}
                      {tipoVenda === 'unidade' && ' - Unidades'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="0"
                        placeholder="0"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        required
                        className="h-7 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="codigo_barras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Código de Barras</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o código de barras" className="h-7 text-xs" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Seção de Imagem */}
            <div className="space-y-1">
              <Label className="text-xs">Imagem do Produto</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={imageType === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageType('url')}
                  className="h-6 px-2 text-xs"
                >
                  <Link className="w-3 h-3 mr-1" />
                  URL
                </Button>
                <Button
                  type="button"
                  variant={imageType === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageType('upload')}
                  className="h-6 px-2 text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Upload
                </Button>
              </div>

              {imageType === 'url' ? (
                <Input
                  placeholder="Cole a URL da imagem aqui"
                  value={form.watch('imagem_url') || ''}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="h-7 text-xs"
                />
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="h-7 text-xs"
                />
              )}

              {previewUrl && (
                <div className="mt-1">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-20 object-cover rounded border"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-1 pt-2">
              <Button type="submit" disabled={createProductMutation.isPending} className="flex-1 h-7 text-xs">
                {createProductMutation.isPending ? 'Criando...' : 'Criar Produto'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-7 text-xs px-2">
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
