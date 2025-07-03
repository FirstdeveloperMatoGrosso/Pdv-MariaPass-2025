import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Archive, AlertTriangle, TrendingUp, TrendingDown, Search, Filter, RefreshCw, Plus, Minus, Edit, Check, X, Upload, Link, Eye, Image as ImageIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CategoryForm from '@/components/CategoryForm';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import { useSystemAlert } from '@/hooks/useSystemAlert';
import SystemAlert from '@/components/SystemAlert';

// Using the actual Supabase type instead of custom interface
type EstoqueItem = {
  id: string;
  nome: string;
  categoria: string;
  estoque: number;
  codigo_barras: string | null;
  preco: number;
  status: string;
  created_at: string;
  updated_at: string;
  imagem_url: string | null;
};

interface Category {
  id: string;
  nome: string;
  descricao: string;
}

const Estoque: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all');
  const [editingEstoque, setEditingEstoque] = useState<{
    [key: string]: number;
  }>({});
  const [newProduct, setNewProduct] = useState({
    nome: '',
    categoria: 'Bebidas',
    preco: 0,
    estoque: 0,
    codigo_barras: '',
    tipo_venda: 'unidade',
    unidades_por_caixa: undefined as number | undefined,
    imagem_url: '',
    descricao: ''
  });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [imageType, setImageType] = useState<'url' | 'upload'>('url');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<EstoqueItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();
  const { alerts, showAlert, removeAlert } = useSystemAlert();

  // Buscar categorias reais do Supabase
  const { data: categories = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      console.log('Buscando categorias do Supabase...');
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar categorias:', error);
        throw error;
      }
      
      console.log('Categorias carregadas:', data);
      return data as Category[];
    },
    staleTime: 30000, // Cache por 30 segundos
    refetchOnWindowFocus: true,
  });

  // Buscar produtos para controle de estoque
  const {
    data: estoqueItems = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['estoque'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('produtos').select('*').order('estoque', {
        ascending: true
      });
      if (error) {
        console.error('Erro ao buscar estoque:', error);
        throw error;
      }
      return data || [];
    }
  });

  // Mutation para criar produto
  const createProductMutation = useMutation({
    mutationFn: async (productData: typeof newProduct) => {
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

      const {
        error
      } = await supabase.from('produtos').insert([{
        ...productData,
        imagem_url: finalImageUrl,
        status: 'ativo'
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['estoque']
      });
      toast.success('Produto adicionado com sucesso!');
      setNewProduct({
        nome: '',
        categoria: categories.length > 0 ? categories[0].nome : 'Bebidas',
        preco: 0,
        estoque: 0,
        codigo_barras: '',
        tipo_venda: 'unidade',
        unidades_por_caixa: undefined,
        imagem_url: '',
        descricao: ''
      });
      setPreviewUrl('');
      setUploadedFile(null);
      setShowAddProduct(false);
    },
    onError: error => {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao adicionar produto');
    }
  });

  // Mutation para atualizar estoque
  const updateEstoqueMutation = useMutation({
    mutationFn: async ({
      id,
      novoEstoque
    }: {
      id: string;
      novoEstoque: number;
    }) => {
      const {
        error
      } = await supabase.from('produtos').update({
        estoque: novoEstoque,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['estoque']
      });
      toast.success('Estoque atualizado com sucesso!');
      setEditingEstoque({});
    },
    onError: error => {
      console.error('Erro ao atualizar estoque:', error);
      toast.error('Erro ao atualizar estoque');
    }
  });

  const filteredItems = estoqueItems.filter((item: EstoqueItem) => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || item.codigo_barras?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
    let matchesAlert = true;
    if (alertFilter === 'baixo') {
      matchesAlert = item.estoque > 0 && item.estoque <= 10;
    } else if (alertFilter === 'zerado') {
      matchesAlert = item.estoque === 0;
    }
    return matchesSearch && matchesCategory && matchesAlert;
  });

  const totalItens = estoqueItems.length;
  const itensZerados = estoqueItems.filter((item: EstoqueItem) => item.estoque === 0).length;
  const itensBaixos = estoqueItems.filter((item: EstoqueItem) => item.estoque > 0 && item.estoque <= 10).length;
  const valorTotalEstoque = estoqueItems.reduce((total: number, item: EstoqueItem) => total + item.estoque * item.preco, 0);

  const adjustEstoque = (id: string, currentEstoque: number, adjustment: number) => {
    const novoEstoque = Math.max(0, currentEstoque + adjustment);
    updateEstoqueMutation.mutate({
      id,
      novoEstoque
    });
  };

  const startEditingEstoque = (id: string, currentEstoque: number) => {
    setEditingEstoque(prev => ({
      ...prev,
      [id]: currentEstoque
    }));
  };

  const cancelEditingEstoque = (id: string) => {
    setEditingEstoque(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const setEstoqueValue = (id: string, value: number) => {
    setEditingEstoque(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const updateEstoqueFromInput = (id: string) => {
    const novoEstoque = editingEstoque[id];
    if (novoEstoque !== undefined && novoEstoque >= 0) {
      updateEstoqueMutation.mutate({
        id,
        novoEstoque
      });
    }
  };

  const getEstoqueStatus = (estoque: number) => {
    if (estoque === 0) return {
      variant: 'destructive' as const,
      text: 'Zerado'
    };
    if (estoque <= 10) return {
      variant: 'default' as const,
      text: 'Baixo'
    };
    return {
      variant: 'secondary' as const,
      text: 'Normal'
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUrlChange = (url: string) => {
    setNewProduct(prev => ({ ...prev, imagem_url: url }));
    setPreviewUrl(url);
  };

  const handleAddProduct = () => {
    if (!newProduct.nome.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    if (newProduct.tipo_venda === 'caixa' && (!newProduct.unidades_por_caixa || newProduct.unidades_por_caixa <= 0)) {
      toast.error('Unidades por caixa é obrigatório quando o tipo de venda é caixa');
      return;
    }
    createProductMutation.mutate(newProduct);
  };

  const handleCategorySuccess = () => {
    // Invalidar queries relacionadas às categorias quando uma nova categoria for criada
    queryClient.invalidateQueries({ queryKey: ['categorias'] });
    queryClient.invalidateQueries({ queryKey: ['estoque'] });
  };

  const handleViewDetails = (product: EstoqueItem) => {
    setSelectedProduct(product);
    setShowDetails(true);
  };

  const handleAddButtonClick = () => {
    showAlert({
      type: 'info',
      title: 'Adicionar Produto',
      message: 'Deseja adicionar um novo produto ao estoque?',
      actions: [
        {
          label: 'Sim, adicionar',
          onClick: () => setShowAddProduct(true),
          variant: 'default'
        },
        {
          label: 'Cancelar',
          onClick: () => {
            // Fecha o alerta quando cancelar é clicado
            const alertToRemove = alerts[0];
            if (alertToRemove) {
              removeAlert(alertToRemove.id);
            }
          },
          variant: 'outline'
        }
      ]
    });
  };

  if (isLoading) {
    return <div className="p-2 sm:p-3 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estoque...</p>
        </div>
      </div>;
  }

  return <div className="pl-4 pr-4 sm:pl-6 sm:pr-6 space-y-2">
      {/* System Alerts */}
      {alerts.map((alert) => (
        <SystemAlert
          key={alert.id}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => removeAlert(alert.id)}
          actions={alert.actions}
        />
      ))}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <Archive className="w-5 h-5 text-green-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Controle de Estoque</h1>
        </div>
        <div className="flex gap-1 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <CategoryForm onSuccess={handleCategorySuccess} />
          </div>
          <Button onClick={handleAddButtonClick} className="flex items-center space-x-1 h-7 text-xs px-2">
            <Plus className="w-3 h-3" />
            <span>Adicionar</span>
          </Button>
          <Button onClick={() => refetch()} variant="outline" className="flex items-center space-x-1 flex-1 sm:flex-none h-8 text-sm">
            <RefreshCw className="w-3 h-3" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddProduct && <Card>
          <CardHeader className="p-2">
            <CardTitle className="text-sm sm:text-base">Adicionar Novo Produto</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Nome do Produto</label>
                <Input value={newProduct.nome} onChange={e => setNewProduct(prev => ({
              ...prev,
              nome: e.target.value
            }))} placeholder="Digite o nome do produto" className="h-8 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Descrição</label>
                <Input value={newProduct.descricao} onChange={e => setNewProduct(prev => ({
              ...prev,
              descricao: e.target.value
            }))} placeholder="Digite a descrição" className="h-8 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Categoria</label>
                <select value={newProduct.categoria} onChange={e => setNewProduct(prev => ({
              ...prev,
              categoria: e.target.value
            }))} className="w-full border rounded-md px-2 py-1 h-8 text-sm">
                  {categories.map(cat => <option key={cat.id} value={cat.nome}>{cat.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Tipo de Venda</label>
                <RadioGroup
                  value={newProduct.tipo_venda}
                  onValueChange={(value) => setNewProduct(prev => ({
                    ...prev,
                    tipo_venda: value,
                    unidades_por_caixa: value === 'unidade' ? undefined : prev.unidades_por_caixa
                  }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unidade" id="unidade" />
                    <Label htmlFor="unidade" className="text-xs">Unidade</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="caixa" id="caixa" />
                    <Label htmlFor="caixa" className="text-xs">Caixa</Label>
                  </div>
                </RadioGroup>
              </div>

              {newProduct.tipo_venda === 'caixa' && (
                <div>
                  <label className="block text-xs font-medium mb-1">Unidades por Caixa</label>
                  <Input 
                    type="number"
                    min="1"
                    value={newProduct.unidades_por_caixa || ''}
                    onChange={e => setNewProduct(prev => ({
                      ...prev,
                      unidades_por_caixa: parseInt(e.target.value) || undefined
                    }))}
                    placeholder="Ex: 12"
                    className="h-8 text-sm"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Preço (R$)
                  {newProduct.tipo_venda === 'caixa' && ' - Por Caixa'}
                  {newProduct.tipo_venda === 'unidade' && ' - Por Unidade'}
                </label>
                <Input type="number" step="0.01" min="0" value={newProduct.preco} onChange={e => setNewProduct(prev => ({
              ...prev,
              preco: parseFloat(e.target.value) || 0
            }))} placeholder="0.00" className="h-8 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Quantidade em Estoque
                  {newProduct.tipo_venda === 'caixa' && ' - Caixas'}
                  {newProduct.tipo_venda === 'unidade' && ' - Unidades'}
                </label>
                <Input type="number" min="0" value={newProduct.estoque} onChange={e => setNewProduct(prev => ({
              ...prev,
              estoque: parseInt(e.target.value) || 0
            }))} placeholder="0" className="h-8 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Código de Barras (Opcional)</label>
                <Input value={newProduct.codigo_barras} onChange={e => setNewProduct(prev => ({
              ...prev,
              codigo_barras: e.target.value
            }))} placeholder="Digite o código de barras" className="h-8 text-sm" />
              </div>
            </div>

            {/* Seção de Imagem */}
            <div className="space-y-2 mt-2">
              <label className="block text-xs font-medium">Imagem do Produto</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={imageType === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageType('url')}
                  className="h-7 text-xs"
                >
                  <Link className="w-3 h-3 mr-1" />
                  URL
                </Button>
                <Button
                  type="button"
                  variant={imageType === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageType('upload')}
                  className="h-7 text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Upload
                </Button>
              </div>

              {imageType === 'url' ? (
                <Input
                  placeholder="Cole a URL da imagem aqui"
                  value={newProduct.imagem_url || ''}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="h-8 text-sm"
                />
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="h-8 text-sm"
                />
              )}

              {previewUrl && (
                <div className="mt-2">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-24 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end mt-2">
              <Button onClick={handleAddProduct} disabled={createProductMutation.isPending} className="h-8 text-sm">
                {createProductMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </CardContent>
        </Card>}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center space-x-1">
              <Archive className="w-4 h-4 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Total de Itens</p>
                <p className="text-lg font-bold">{totalItens}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Estoque Zerado</p>
                <p className="text-lg font-bold text-red-600">{itensZerados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <div className="flex items-center space-x-1">
              <TrendingDown className="w-4 h-4 text-yellow-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Estoque Baixo</p>
                <p className="text-lg font-bold text-yellow-600">{itensBaixos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Valor Total</p>
                <p className="text-lg font-bold text-green-600">R$ {valorTotalEstoque.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-2">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input placeholder="Buscar por nome ou código de barras..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 h-8 text-sm" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center space-x-1 flex-1">
                <Filter className="w-3 h-3 text-gray-500" />
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border rounded-md px-2 py-1 w-full h-8 text-sm">
                  <option value="all">Todas as categorias</option>
                  {categories.map(cat => <option key={cat.id} value={cat.nome}>{cat.nome}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-1 flex-1">
                <AlertTriangle className="w-3 h-3 text-gray-500" />
                <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)} className="border rounded-md px-2 py-1 w-full h-8 text-sm">
                  <option value="all">Todos os status</option>
                  <option value="zerado">Estoque zerado</option>
                  <option value="baixo">Estoque baixo</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Estoque */}
      <Card>
        <CardHeader className="p-2">
          <CardTitle className="text-sm">Controle de Estoque ({filteredItems.length} itens)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs w-16">Imagem</TableHead>
                  <TableHead className="h-8 text-xs">Produto</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell h-8 text-xs">Código</TableHead>
                  <TableHead className="h-8 text-xs">Estoque</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Status</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Valor Unit.</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Valor Total</TableHead>
                  <TableHead className="h-8 text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: EstoqueItem) => {
                const status = getEstoqueStatus(item.estoque);
                const isEditing = editingEstoque[item.id] !== undefined;
                return <TableRow key={item.id}>
                      <TableCell className="p-1">
                        <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                          {item.imagem_url ? (
                            <img 
                              src={item.imagem_url} 
                              alt={item.nome}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium p-2">
                        <div>
                          <div className="text-xs font-semibold">{item.nome}</div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {item.categoria}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2">
                        <Badge variant="outline" className="text-xs">{item.categoria}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2">
                        <code className="bg-gray-100 px-1 py-1 rounded text-xs">
                          {item.codigo_barras || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="p-2">
                        {isEditing ? (
                          <div className="space-y-1 min-w-[120px]">
                            <div className="text-xs text-gray-600">
                              Atual: <span className="font-semibold text-blue-600">{item.estoque} un.</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={editingEstoque[item.id]}
                                onChange={(e) => setEstoqueValue(item.id, parseInt(e.target.value) || 0)}
                                className="w-16 h-6 text-xs text-center border-blue-300 focus:border-blue-500"
                                placeholder="0"
                              />
                              <span className="text-xs text-gray-500">un.</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => updateEstoqueFromInput(item.id)}
                                className="h-6 px-1 bg-green-600 hover:bg-green-700 text-xs"
                                disabled={updateEstoqueMutation.isPending}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEditingEstoque(item.id)}
                                className="h-6 px-1 text-xs"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold min-w-[40px]">{item.estoque} un.</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2">
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 text-xs">R$ {item.preco.toFixed(2)}</TableCell>
                      <TableCell className="hidden lg:table-cell p-2 text-xs">R$ {(item.estoque * item.preco).toFixed(2)}</TableCell>
                      <TableCell className="p-1">
                        <div className="flex flex-col gap-1 min-w-[70px]">
                          {!isEditing && (
                            <>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => adjustEstoque(item.id, item.estoque, -1)}
                                  disabled={item.estoque === 0 || updateEstoqueMutation.isPending}
                                  className="h-6 w-6 p-0 border-red-300 hover:bg-red-50"
                                  title="Diminuir 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => adjustEstoque(item.id, item.estoque, 1)}
                                  disabled={updateEstoqueMutation.isPending}
                                  className="h-6 w-6 p-0 border-green-300 hover:bg-green-50"
                                  title="Aumentar 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(item)}
                                  className="h-6 w-6 p-0 border-blue-300 hover:bg-blue-50"
                                  title="Visualizar produto"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingEstoque(item.id, item.estoque)}
                                  className="h-6 w-6 p-0 border-blue-300 hover:bg-blue-50"
                                  title="Editar quantidade"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>;
              })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </div>;
};

export default Estoque;
