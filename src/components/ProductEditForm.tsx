
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Upload, Link, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface Product {
  id: string;
  nome: string;
  preco: number;
  codigo_barras?: string;
  categoria: string;
  estoque: number;
  status: string;
  imagem_url?: string;
}

interface ProductEditFormProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onProductUpdated?: () => void;
}

interface Category {
  id: string;
  nome: string;
  descricao: string;
}

const ProductEditForm: React.FC<ProductEditFormProps> = ({ 
  open, 
  onClose, 
  product, 
  onProductUpdated 
}) => {
  const [imageType, setImageType] = useState<'url' | 'upload'>('url');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    nome: '',
    preco: 0,
    codigo_barras: '',
    categoria: '',
    estoque: 0,
    status: 'ativo',
    imagem_url: '',
  });

  // Initialize form data when product changes
  React.useEffect(() => {
    if (product) {
      setFormData({
        nome: product.nome,
        preco: product.preco,
        codigo_barras: product.codigo_barras || '',
        categoria: product.categoria,
        estoque: product.estoque,
        status: product.status,
        imagem_url: product.imagem_url || '',
      });
      setPreviewUrl(product.imagem_url || '');
    }
  }, [product]);

  const queryClient = useQueryClient();

  // Buscar categorias do Supabase
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      console.log('Buscando categorias para edição...');
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar categorias:', error);
        throw error;
      }
      
      console.log('Categorias carregadas na edição:', data);
      return data as Category[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!product) return;
      
      console.log('Atualizando produto:', product.id, data);
      
      let finalImageUrl = data.imagem_url;

      // Se foi feito upload de arquivo, fazer upload para o Supabase Storage
      if (uploadedFile && imageType === 'upload') {
        try {
          const fileExt = uploadedFile.name.split('.').pop();
          const fileName = `produto-${product.id}-${Date.now()}.${fileExt}`;
          
          console.log('Fazendo upload do arquivo:', fileName);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('produtos')
            .upload(fileName, uploadedFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Erro no upload:', uploadError);
            throw new Error('Erro ao fazer upload da imagem: ' + uploadError.message);
          }

          console.log('Upload realizado com sucesso:', uploadData);

          // Obter URL pública da imagem
          const { data: { publicUrl } } = supabase.storage
            .from('produtos')
            .getPublicUrl(fileName);
          
          console.log('URL pública da imagem:', publicUrl);
          finalImageUrl = publicUrl;
        } catch (error) {
          console.error('Erro durante upload:', error);
          throw error;
        }
      }

      // Atualizar produto no banco
      const updateData = {
        nome: data.nome,
        preco: data.preco,
        codigo_barras: data.codigo_barras,
        categoria: data.categoria,
        estoque: data.estoque,
        status: data.status,
        imagem_url: finalImageUrl,
        updated_at: new Date().toISOString()
      };

      console.log('Dados para atualização:', updateData);

      const { error } = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', product.id);
      
      if (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
      }

      console.log('Produto atualizado com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto atualizado com sucesso!');
      onClose();
      setUploadedFile(null);
      onProductUpdated?.();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) {
      toast.error('Produto não encontrado');
      return;
    }
    
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      console.log('Arquivo selecionado:', file.name, file.size, file.type);
    }
  };

  const handleUrlChange = (url: string) => {
    handleInputChange('imagem_url', url);
    setPreviewUrl(url);
    setUploadedFile(null);
  };

  // Don't render if no product
  if (!product) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-3 bg-gray-50">
          <DialogTitle className="text-sm font-medium">Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna Esquerda - Campos do Formulário */}
              <div className="space-y-3">
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
            <Select 
              value={formData.categoria} 
              onValueChange={(value) => {
                console.log('Categoria selecionada na edição:', value);
                handleInputChange('categoria', value);
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
                    <SelectItem key={category.id} value={category.nome}>
                      {category.nome}
                    </SelectItem>
                  ))
                )}
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



              </div>
              
              {/* Coluna Direita - Imagem */}
              <div className="space-y-3">
                {/* Seção de Imagem */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Imagem do Produto</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={imageType === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImageType('url')}
                      className="h-7 text-xs px-2 flex-1"
                    >
                      <Link className="w-3 h-3 mr-1" />
                      URL
                    </Button>
                    <Button
                      type="button"
                      variant={imageType === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImageType('upload')}
                      className="h-7 text-xs px-2 flex-1"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                  </div>

                  {imageType === 'url' ? (
                    <Input
                      placeholder="Cole a URL da imagem aqui"
                      value={formData.imagem_url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="h-8 text-xs mb-2"
                    />
                  ) : (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="h-8 text-xs mb-2"
                    />
                  )}

                  {/* Preview da Imagem */}
                  {previewUrl ? (
                    <div className="border rounded-md p-2 bg-white">
                      <div className="relative aspect-square max-h-64 mx-auto">
                        <img 
                          src={previewUrl} 
                          alt="Preview do produto" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Visualização da imagem
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center bg-gray-50 aspect-square">
                      <ImageIcon className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500 text-center">
                        {imageType === 'url' 
                          ? 'Nenhuma imagem carregada' 
                          : 'Nenhum arquivo selecionado'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Rodapé com botões */}
          <div className="border-t bg-gray-50 px-4 py-3 flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateProductMutation.isPending}
              className="h-8 text-xs px-4"
            >
              {updateProductMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditForm;
