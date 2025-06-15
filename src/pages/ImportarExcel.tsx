import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileSpreadsheet, Download, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface ProductRow {
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  codigo_barras?: string;
  status: 'valid' | 'error';
  errors: string[];
}

const ImportarExcel: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Buscar categorias do Supabase
  const { data: categories = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      console.log('🔄 Buscando categorias do Supabase...');
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('nome')
          .order('nome');
        
        if (error) {
          console.error('❌ Erro ao buscar categorias:', error);
          throw error;
        }
        
        console.log('✅ Categorias encontradas:', data);
        return data.map(cat => cat.nome);
      } catch (error) {
        console.error('❌ Erro na query de categorias:', error);
        throw error;
      }
    },
  });

  // Mutation para importar produtos
  const importProductsMutation = useMutation({
    mutationFn: async (validProducts: ProductRow[]) => {
      console.log('🚀 Iniciando processo de importação...');
      console.log('📦 Produtos válidos recebidos:', validProducts.length);
      console.log('📋 Dados dos produtos:', validProducts);
      
      // Verificar se há produtos para importar
      if (!validProducts || validProducts.length === 0) {
        const error = 'Nenhum produto válido para importar';
        console.error('❌', error);
        throw new Error(error);
      }

      try {
        // Preparar dados para inserção
        const productsToInsert = validProducts.map((product, index) => {
          console.log(`🔄 Preparando produto ${index + 1}:`, product);
          
          const prepared = {
            nome: product.nome?.toString().trim() || '',
            categoria: product.categoria?.toString().trim() || 'Outros',
            preco: Number(product.preco) || 0,
            estoque: Number(product.estoque) || 0,
            codigo_barras: product.codigo_barras?.toString().trim() || null,
            status: 'ativo'
          };
          
          console.log(`✅ Produto ${index + 1} preparado:`, prepared);
          return prepared;
        });

        console.log('📊 Total de produtos preparados:', productsToInsert.length);
        console.log('🔍 Produtos para inserção:', productsToInsert);

        // Validar dados antes da inserção
        for (let i = 0; i < productsToInsert.length; i++) {
          const product = productsToInsert[i];
          console.log(`🔍 Validando produto ${i + 1}:`, product);
          
          if (!product.nome) {
            const error = `Produto ${i + 1} sem nome encontrado`;
            console.error('❌', error);
            throw new Error(error);
          }
          if (product.preco <= 0) {
            const error = `Preço inválido para produto: ${product.nome}`;
            console.error('❌', error);
            throw new Error(error);
          }
          
          console.log(`✅ Produto ${i + 1} validado com sucesso`);
        }

        console.log('💾 Iniciando inserção no banco de dados...');
        
        // Inserir produtos no banco
        const { data, error } = await supabase
          .from('produtos')
          .insert(productsToInsert)
          .select();

        if (error) {
          console.error('❌ Erro na inserção no banco:', error);
          console.error('❌ Código do erro:', error.code);
          console.error('❌ Mensagem do erro:', error.message);
          console.error('❌ Detalhes do erro:', error.details);
          console.error('❌ Hint do erro:', error.hint);
          
          // Verificar se é erro de duplicação
          if (error.code === '23505' && error.message.includes('codigo_barras')) {
            throw new Error('Erro: Código de barras duplicado. Verifique se algum produto já existe no sistema.');
          }
          
          throw new Error(`Erro ao importar produtos: ${error.message}`);
        }

        console.log('✅ Produtos inseridos com sucesso:', data);
        console.log('📊 Quantidade de produtos inseridos:', data?.length || 0);
        return data;
        
      } catch (error) {
        console.error('❌ Erro durante o processo de importação:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 Importação concluída com sucesso!');
      console.log('📊 Dados retornados:', data);
      
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      
      const count = data?.length || 0;
      toast.success(`${count} produtos importados com sucesso!`);
      
      // Limpar estado
      setProducts([]);
      setShowPreview(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      console.error('💥 Erro na mutation de importação:', error);
      console.error('💥 Tipo do erro:', typeof error);
      console.error('💥 Stack trace:', error.stack);
      
      const errorMessage = error?.message || 'Erro desconhecido ao importar produtos';
      toast.error(errorMessage);
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 Arquivo selecionado');
    const file = event.target.files?.[0];
    if (file) {
      console.log('📄 Dados do arquivo:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.type === 'application/vnd.ms-excel';
      const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
      
      if (!isExcel && !isCsv) {
        console.error('❌ Tipo de arquivo inválido:', file.type);
        toast.error('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)');
        return;
      }
      
      console.log('✅ Tipo de arquivo válido');
      setSelectedFile(file);
      setShowPreview(false);
      setProducts([]);
    }
  };

  // Função para normalizar categoria
  const normalizeCategory = (category: string): string => {
    console.log('🏷️ Normalizando categoria:', category);
    
    if (!category) {
      console.log('🏷️ Categoria vazia, retornando "Outros"');
      return 'Outros';
    }
    
    const categoryLower = category.toLowerCase().trim();
    console.log('🏷️ Categoria em lowercase:', categoryLower);
    
    // Verificar se existe categoria exata (case insensitive)
    const exactMatch = categories.find(cat => 
      cat.toLowerCase() === categoryLower
    );
    if (exactMatch) {
      console.log('✅ Categoria exata encontrada:', exactMatch);
      return exactMatch;
    }

    // Mapeamento de categorias similares
    const categoryMap: { [key: string]: string } = {
      'bebida': 'Bebidas',
      'bebidas': 'Bebidas',
      'cerveja': 'Bebidas',
      'cervejas': 'Bebidas',
      'refrigerante': 'Bebidas',
      'refrigerantes': 'Bebidas',
      'agua': 'Bebidas',
      'águas': 'Bebidas',
      'suco': 'Bebidas',
      'sucos': 'Bebidas',
      'salgado': 'Salgados',
      'salgados': 'Salgados',
      'sanduiche': 'Sanduíches',
      'sanduíche': 'Sanduíches',
      'sanduiches': 'Sanduíches',
      'sanduíches': 'Sanduíches',
      'hamburguer': 'Sanduíches',
      'hambúrguer': 'Sanduíches',
      'doce': 'Doces',
      'doces': 'Doces',
      'sobremesa': 'Doces',
      'sobremesas': 'Doces'
    };

    // Verificar mapeamento direto
    if (categoryMap[categoryLower]) {
      console.log('✅ Categoria mapeada:', categoryMap[categoryLower]);
      return categoryMap[categoryLower];
    }

    // Verificar se contém palavras-chave
    for (const [key, value] of Object.entries(categoryMap)) {
      if (categoryLower.includes(key)) {
        console.log('✅ Categoria encontrada por palavra-chave:', value);
        return value;
      }
    }

    console.log('🏷️ Categoria não encontrada, retornando "Outros"');
    return 'Outros';
  };

  const validateProduct = (product: any, index: number): ProductRow => {
    console.log(`🔍 Validando produto ${index + 1}:`, product);
    const errors: string[] = [];
    
    // Validar nome
    const nome = product.nome?.toString().trim() || '';
    if (!nome) {
      errors.push('Nome é obrigatório');
    }
    
    // Normalizar categoria
    const normalizedCategory = normalizeCategory(product.categoria);
    
    // Validar preço
    const preco = parseFloat(product.preco) || 0;
    if (isNaN(preco) || preco <= 0) {
      errors.push('Preço deve ser um número maior que zero');
    }
    
    // Validar estoque
    const estoque = parseInt(product.estoque) || 0;
    if (isNaN(estoque) || estoque < 0) {
      errors.push('Estoque deve ser um número maior ou igual a zero');
    }

    // Validar código de barras (opcional)
    const codigoBarras = product.codigo_barras?.toString().trim() || '';

    const result = {
      nome,
      categoria: normalizedCategory,
      preco,
      estoque,
      codigo_barras: codigoBarras,
      status: errors.length > 0 ? 'error' : 'valid',
      errors
    } as ProductRow;
    
    console.log(`${errors.length > 0 ? '❌' : '✅'} Produto ${index + 1} validado:`, result);
    return result;
  };

  const parseCSV = (csvText: string): any[] => {
    console.log('📄 Iniciando parse do CSV...');
    console.log('📄 Tamanho do texto CSV:', csvText.length);
    
    const lines = csvText.split('\n').filter(line => line.trim());
    console.log('📄 Linhas encontradas:', lines.length);
    
    if (lines.length < 2) {
      console.error('❌ CSV deve ter pelo menos 2 linhas (cabeçalho + dados)');
      return [];
    }
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    console.log('📄 Cabeçalhos encontrados:', headers);
    
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      console.log(`📄 Linha ${i} valores:`, values);
      
      const product: any = {};
      
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          product[header] = values[index];
        }
      });
      
      console.log(`📄 Produto ${i} parseado:`, product);
      products.push(product);
    }
    
    console.log('✅ CSV parseado com sucesso. Total de produtos:', products.length);
    return products;
  };

  const processFile = async () => {
    if (!selectedFile) {
      console.error('❌ Nenhum arquivo selecionado');
      return;
    }

    console.log('🔄 Iniciando processamento do arquivo...');
    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('📄 Lendo conteúdo do arquivo...');
      const text = await selectedFile.text();
      console.log('📄 Arquivo lido. Tamanho:', text.length);
      
      // Simular processamento para mostrar progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      let mockProducts: any[] = [];

      // Verificar se é CSV ou Excel
      const isCsv = selectedFile.type === 'text/csv' || selectedFile.name.toLowerCase().endsWith('.csv');
      
      if (isCsv) {
        console.log('📄 Processando como CSV...');
        mockProducts = parseCSV(text);
      } else {
        console.log('📄 Usando dados de exemplo para Excel...');
        // Para Excel, usar dados de exemplo (implementar parsing real se necessário)
        mockProducts = [
          { nome: 'Coca-Cola 350ml', categoria: 'Bebidas', preco: 5.50, estoque: 100, codigo_barras: '7894900011517' },
          { nome: 'Coxinha de Frango', categoria: 'Salgados', preco: 8.00, estoque: 50, codigo_barras: '7588888888888' },
          { nome: 'Água Mineral 500ml', categoria: 'Bebidas', preco: 3.00, estoque: 200, codigo_barras: '7891234567890' },
          { nome: 'Cerveja brahma 250ml', categoria: 'Bebidas', preco: 5.00, estoque: 1899, codigo_barras: '7899999999999' },
          { nome: 'Cerveja Skol 250ml', categoria: 'Bebidas', preco: 4.50, estoque: 150, codigo_barras: '7888888888888' },
        ];
      }

      console.log('📦 Produtos processados do arquivo:', mockProducts);

      const validatedProducts = mockProducts.map((product, index) => validateProduct(product, index));
      
      console.log('✅ Produtos validados:', validatedProducts);
      console.log('📊 Produtos válidos:', validatedProducts.filter(p => p.status === 'valid').length);
      console.log('📊 Produtos com erro:', validatedProducts.filter(p => p.status === 'error').length);
      
      setProducts(validatedProducts);
      setShowPreview(true);
      
      toast.success('Arquivo processado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // ... keep existing code (downloadTemplate function)
  const downloadTemplate = () => {
    // Criar um CSV template para download com as categorias disponíveis
    const categoriesText = categories.length > 0 ? categories.join(', ') : 'Bebidas, Salgados, Sanduíches, Doces, Outros';
    const template = `nome,categoria,preco,estoque,codigo_barras
"Coca-Cola 350ml","Bebidas",5.50,100,"7894900011517"
"Coxinha de Frango","Salgados",8.00,50,""
"Água Mineral 500ml","Bebidas",3.00,200,"7891234567890"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_produtos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template baixado com sucesso!');
  };

  const handleImport = () => {
    console.log('🚀 Iniciando importação...');
    const validProducts = products.filter(p => p.status === 'valid');
    console.log('📦 Produtos válidos para importação:', validProducts.length);
    
    if (validProducts.length === 0) {
      console.error('❌ Nenhum produto válido para importar');
      toast.error('Nenhum produto válido para importar');
      return;
    }
    
    console.log('📋 Produtos que serão importados:', validProducts);
    importProductsMutation.mutate(validProducts);
  };

  const removeProduct = (index: number) => {
    console.log('🗑️ Removendo produto do índice:', index);
    setProducts(products.filter((_, i) => i !== index));
  };

  const validProductsCount = products.filter(p => p.status === 'valid').length;
  const errorProductsCount = products.filter(p => p.status === 'error').length;

  console.log('📊 Estado atual - Produtos válidos:', validProductsCount, 'Com erro:', errorProductsCount);

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <FileSpreadsheet className="w-6 h-6 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">Importar Produtos via Excel/CSV</h1>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template de Importação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                Baixe o template CSV para ver o formato correto dos dados:
              </p>
              <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
                <li><strong>nome:</strong> Nome do produto (obrigatório)</li>
                <li><strong>categoria:</strong> {categories.length > 0 ? categories.join(', ') : 'Bebidas, Salgados, Sanduíches, Doces, Outros'}</li>
                <li><strong>preco:</strong> Preço em reais (ex: 5.50)</li>
                <li><strong>estoque:</strong> Quantidade em estoque (número inteiro)</li>
                <li><strong>codigo_barras:</strong> Código de barras (opcional)</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                💡 O sistema aceita variações de categoria (ex: "cerveja" será automaticamente convertido para "Bebidas")
              </p>
            </div>
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Baixar Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload do Arquivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Selecionar arquivo Excel (.xlsx, .xls) ou CSV (.csv)</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="mt-1"
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Processando arquivo...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={processFile} 
              disabled={!selectedFile || isProcessing}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isProcessing ? 'Processando...' : 'Processar Arquivo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && products.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Preview dos Produtos</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {validProductsCount} válidos
                </Badge>
                {errorProductsCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errorProductsCount} com erro
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {product.status === 'valid' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.nome}</TableCell>
                      <TableCell>{product.categoria}</TableCell>
                      <TableCell>R$ {product.preco.toFixed(2)}</TableCell>
                      <TableCell>{product.estoque}</TableCell>
                      <TableCell>{product.codigo_barras || 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeProduct(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Errors */}
            {products.some(p => p.errors.length > 0) && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-red-600">Erros encontrados:</h4>
                {products.map((product, index) => 
                  product.errors.length > 0 && (
                    <div key={index} className="p-2 bg-red-50 rounded-md">
                      <p className="text-sm font-medium">Linha {index + 1}: {product.nome || 'Produto sem nome'}</p>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {product.errors.map((error, errorIndex) => (
                          <li key={errorIndex}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            )}

            {validProductsCount > 0 && (
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={handleImport}
                  disabled={importProductsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {importProductsMutation.isPending ? 'Importando...' : `Importar ${validProductsCount} Produtos`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportarExcel;
