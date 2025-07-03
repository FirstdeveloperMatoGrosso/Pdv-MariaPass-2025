import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  User, 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Loader2,
  Users,
  FilterX,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import type { Cliente } from '@/lib/supabase';
import CadastroCliente from '@/components/CadastroCliente';

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Carregar clientes
  const loadClientes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      
      if (activeTab !== 'todos') {
        query = query.eq('tipo', activeTab === 'pf' ? 'PF' : 'PJ');
      }
      
      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, [activeTab, searchTerm]);

  // Formatar CPF/CNPJ
  const formatarDocumento = (documento: string, tipo: 'PF' | 'PJ') => {
    if (!documento) return '';
    
    const apenasNumeros = documento.replace(/\D/g, '');
    
    if (tipo === 'PF') {
      // Formatar CPF: 000.000.000-00
      return apenasNumeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(\-\d{2})\d+?$/, '$1');
    } else {
      // Formatar CNPJ: 00.000.000/0000-00
      return apenasNumeros
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\/\d{4})(\d)/, '$1-$2');
    }
  };

  // Formatar telefone
  const formatarTelefone = (telefone: string) => {
    if (!telefone) return '';
    
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    if (apenasNumeros.length <= 10) {
      // Formato: (00) 0000-0000
      return apenasNumeros
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Formato: (00) 00000-0000
      return apenasNumeros
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d{4})/, '$1-$2');
    }
  };

  // Excluir cliente
  const excluirCliente = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Cliente excluído com sucesso!');
      loadClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    } finally {
      setLoading(false);
    }
  };

  // Editar cliente
  const editarCliente = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
  };

  // Filtrar clientes
  const filteredClientes = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.documento.includes(searchTerm) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);

  // Mudar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Função para lidar com o sucesso do cadastro/edição
  const handleSuccess = () => {
    setShowForm(false);
    setEditingCliente(null);
    loadClientes();
  };
  
  // Função para lidar com o cancelamento do formulário
  const handleCancel = () => {
    setShowForm(false);
    setEditingCliente(null);
  };

  if (showForm) {
    return (
      <div className="p-4">
        <Button 
          variant="ghost" 
          onClick={handleCancel}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a lista
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </CardTitle>
            <CardDescription>
              {editingCliente ? 'Atualize os dados do cliente' : 'Preencha os dados do novo cliente'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CadastroCliente 
              clienteId={editingCliente?.id}
              initialData={editingCliente || undefined}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus clientes e empresas cadastradas
          </p>
        </div>
        
        <Button 
          onClick={() => {
            setEditingCliente(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>
      
      <Card>
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="pf" className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Pessoas Físicas
                </TabsTrigger>
                <TabsTrigger value="pj" className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  Empresas
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar clientes..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="text-center p-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">Nenhum cliente encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm 
                  ? 'Nenhum cliente corresponde à sua busca.' 
                  : 'Comece adicionando um novo cliente.'}
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>{activeTab === 'pj' ? 'CNPJ' : 'CPF'}</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {cliente.tipo === 'PJ' ? (
                              <Building className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <User className="w-4 h-4 text-muted-foreground" />
                            )}
                            {cliente.nome}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatarDocumento(cliente.documento, cliente.tipo)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {cliente.email && <div className="text-sm">{cliente.email}</div>}
                            {cliente.telefone && (
                              <div className="text-sm text-muted-foreground">
                                {formatarTelefone(cliente.telefone)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {cliente.endereco?.logradouro && (
                            <div className="text-sm">
                              {cliente.endereco.logradouro}, {cliente.endereco.numero}
                              {cliente.endereco.complemento && `, ${cliente.endereco.complemento}`}
                            </div>
                          )}
                          {cliente.endereco?.bairro && (
                            <div className="text-sm text-muted-foreground">
                              {cliente.endereco.bairro} - {cliente.endereco.cidade}/{cliente.endereco.uf}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(cliente.data_cadastro), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cliente.ativo ? 'default' : 'outline'}>
                            {cliente.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editarCliente(cliente)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => excluirCliente(cliente.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredClientes.length)}
                    </span>{' '}
                    de <span className="font-medium">{filteredClientes.length}</span> clientes
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Mostrar páginas próximas à página atual
                        let pageNum = currentPage <= 3 
                          ? i + 1 
                          : currentPage >= totalPages - 2 
                            ? totalPages - 4 + i 
                            : currentPage - 2 + i;
                            
                        if (pageNum < 1 || pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => paginate(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <span className="px-2">...</span>
                      )}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => paginate(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clientes;
