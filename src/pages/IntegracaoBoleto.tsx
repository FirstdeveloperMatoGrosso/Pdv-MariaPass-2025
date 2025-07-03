
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Banknote, 
  Settings, 
  TestTube, 
  CreditCard, 
  FileText, 
  Plus, 
  Download, 
  Copy, 
  ExternalLink,
  Search,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NovaVendaBoleto from '@/components/NovaVendaBoleto';
import { paymentService } from '@/services/paymentService';

// Interface para os dados do boleto
interface Boleto {
  id: string;
  chargeId: string;
  barcode: string;
  boletoUrl: string;
  pdfUrl: string;
  dueDate: string;
  valor: number;
  cliente: string;
  documento: string;
  descricao: string;
  dataEmissao: string;
  status: 'pending' | 'paid' | 'canceled' | 'failed';
}

const IntegracaoBoleto = () => {
  const [config, setConfig] = useState({
    banco: '341', // Código do banco (ex: 341 para Itaú)
    agencia: '',
    conta: '',
    carteira: '109', // Carteira padrão
    convenio: '',
    codigoBeneficiario: '',
    ambiente: 'homologacao',
    ativo: false,
    diasVencimento: 5,
    juros: 1, // 1% ao mês
    multa: 2, // 2% de multa
  });
  
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('boletos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Carregar configurações salvas
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Aqui você pode carregar as configurações salvas do banco de dados
        // Exemplo: const savedConfig = await api.get('/configuracoes/boleto');
        // setConfig(savedConfig);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    
    loadConfig();
    
    // Carregar boletos existentes
    loadBoletos();
  }, []);
  
  // Carregar lista de boletos
  const loadBoletos = async () => {
    setIsLoading(true);
    try {
      // Aqui você pode carregar os boletos do banco de dados
      // Exemplo: const response = await api.get('/boletos');
      // setBoletos(response.data);
      
      // Mock de dados para teste
      const mockBoletos: Boleto[] = [];
      setBoletos(mockBoletos);
    } catch (error) {
      console.error('Erro ao carregar boletos:', error);
      toast.error('Erro ao carregar lista de boletos');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Salvar configurações
  const handleSaveConfig = async () => {
    try {
      // Aqui você pode salvar as configurações no banco de dados
      // Exemplo: await api.post('/configuracoes/boleto', config);
      console.log('Salvando configurações de Boleto:', config);
      toast.success('Configurações de Boleto salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  // Testar conexão com o banco
  const handleTestConnection = async () => {
    if (!config.banco || !config.agencia || !config.conta) {
      toast.error('Preencha os dados bancários para testar a conexão');
      return;
    }
    
    setIsLoading(true);
    toast.info('Testando conexão bancária...');
    
    try {
      // Aqui você pode implementar um teste real de conexão com o banco
      // Exemplo: await paymentService.testarConexaoBoleto(config);
      
      // Simulando um atraso para o teste
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Conexão bancária estabelecida com sucesso!');
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Falha ao conectar com o banco. Verifique as configurações.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Adicionar novo boleto à lista
  const handleBoletoGerado = (novoBoleto: any) => {
    setBoletos([novoBoleto, ...boletos]);
    setActiveTab('boletos');
    toast.success('Boleto gerado com sucesso!');
  };
  
  // Copiar código de barras para a área de transferência
  const copiarCodigoBarras = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.success('Código de barras copiado!');
  };
  
  // Formatar data
  const formatarData = (data: string) => {
    try {
      return format(parseISO(data), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // Formatar valor monetário
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  // Filtrar boletos pelo termo de busca
  const filteredBoletos = boletos.filter(boleto => 
    boleto.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boleto.documento.includes(searchTerm) ||
    boleto.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boleto.chargeId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Paginação
  const totalPages = Math.ceil(filteredBoletos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBoletos.slice(indexOfFirstItem, indexOfLastItem);
  
  // Mudar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Obter badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Pago</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-300 text-red-700">Falha</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-1 mb-1">
        <div className="flex items-center gap-1">
          <Banknote className="w-4 h-4 text-green-600" />
          <div>
            <h1 className="text-sm font-bold">Integração Boleto</h1>
            <p className="text-xs text-gray-600">
              {activeTab === 'boletos' 
                ? 'Emita e gerencie boletos bancários' 
                : 'Configure a integração bancária para emissão de boletos'}
            </p>
          </div>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-1"
        defaultValue="boletos"
      >
        <TabsList className="grid w-full grid-cols-3 h-7">
          <TabsTrigger value="configuracao" className="text-xs">Configurações</TabsTrigger>
          <TabsTrigger value="teste" className="text-xs">Teste</TabsTrigger>
          <TabsTrigger value="boletos" className="text-xs flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Boletos {boletos.length > 0 && `(${boletos.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="flex items-center gap-1 text-sm">
                <Settings className="w-3 h-3" />
                Configurações Bancárias
              </CardTitle>
              <CardDescription className="text-xs">
                Configure os dados bancários para emissão de boletos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="banco" className="text-xs">Código do Banco</Label>
                  <Input
                    id="banco"
                    placeholder="Ex: 341, 033, 104"
                    value={config.banco}
                    onChange={(e) => setConfig({...config, banco: e.target.value})}
                    className="h-7 text-xs"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="agencia" className="text-xs">Agência</Label>
                  <Input
                    id="agencia"
                    placeholder="Número da agência"
                    value={config.agencia}
                    onChange={(e) => setConfig({...config, agencia: e.target.value})}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="conta" className="text-xs">Conta</Label>
                  <Input
                    id="conta"
                    placeholder="Número da conta"
                    value={config.conta}
                    onChange={(e) => setConfig({...config, conta: e.target.value})}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="carteira" className="text-xs">Carteira</Label>
                  <Input
                    id="carteira"
                    placeholder="Número da carteira"
                    value={config.carteira}
                    onChange={(e) => setConfig({...config, carteira: e.target.value})}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="convenio" className="text-xs">Convênio</Label>
                  <Input
                    id="convenio"
                    placeholder="Número do convênio"
                    value={config.convenio}
                    onChange={(e) => setConfig({...config, convenio: e.target.value})}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="codigoBeneficiario" className="text-xs">Código do Beneficiário</Label>
                <Input
                  id="codigoBeneficiario"
                  placeholder="Código do beneficiário"
                  value={config.codigoBeneficiario}
                  onChange={(e) => setConfig({...config, codigoBeneficiario: e.target.value})}
                  className="h-7 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="diasVencimento" className="text-xs">Dias p/ Vencimento</Label>
                  <Input
                    id="diasVencimento"
                    type="number"
                    value={config.diasVencimento}
                    onChange={(e) => setConfig({...config, diasVencimento: parseInt(e.target.value)})}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="juros" className="text-xs">Juros (% mês)</Label>
                  <Input
                    id="juros"
                    type="number"
                    step="0.01"
                    value={config.juros}
                    onChange={(e) => setConfig({...config, juros: parseFloat(e.target.value)})}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="multa" className="text-xs">Multa (%)</Label>
                  <Input
                    id="multa"
                    type="number"
                    step="0.01"
                    value={config.multa}
                    onChange={(e) => setConfig({...config, multa: parseFloat(e.target.value)})}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ambiente" className="text-xs">Ambiente</Label>
                <select
                  id="ambiente"
                  className="w-full p-1 border rounded-md h-7 text-xs"
                  value={config.ambiente}
                  onChange={(e) => setConfig({...config, ambiente: e.target.value})}
                >
                  <option value="homologacao">Homologação</option>
                  <option value="producao">Produção</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-xs">Integração Ativa</Label>
                  <p className="text-xs text-gray-600">Ative para começar a emitir boletos</p>
                </div>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={(checked) => setConfig({...config, ativo: checked})}
                />
              </div>

              <div className="pt-1">
                <Button onClick={handleSaveConfig} className="w-full h-7 text-xs">
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teste">
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="flex items-center gap-1 text-sm">
                <TestTube className="w-3 h-3" />
                Teste de Conexão Bancária
              </CardTitle>
              <CardDescription className="text-xs">
                Teste a conexão com o banco para validar as configurações
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  Certifique-se de ter configurado todos os dados bancários antes de testar.
                </p>
              </div>
              
              <Button onClick={handleTestConnection} className="w-full h-7 text-xs">
                <CreditCard className="w-3 h-3 mr-1" />
                Testar Conexão Bancária
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boletos" className="space-y-4">
          <NovaVendaBoleto 
            onBoletoGerado={handleBoletoGerado}
            config={{
              diasVencimento: config.diasVencimento,
              juros: config.juros,
              multa: config.multa
            }}
          />
          
          <Card>
            <CardHeader className="p-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">Boletos Emitidos</CardTitle>
                  <CardDescription className="text-xs">
                    {boletos.length > 0 
                      ? `${boletos.length} boleto(s) encontrado(s)` 
                      : 'Nenhum boleto encontrado'}
                  </CardDescription>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar boletos..."
                    className="pl-8 h-8 text-xs w-full sm:w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-2">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredBoletos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Nenhum boleto encontrado</p>
                  <p className="text-xs">Os boletos emitidos aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentItems.map((boleto) => (
                          <TableRow key={boleto.id}>
                            <TableCell className="font-medium text-xs">
                              {boleto.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{boleto.cliente}</div>
                              <div className="text-xs text-muted-foreground">
                                {boleto.documento}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatarData(boleto.dueDate)}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {formatarMoeda(boleto.valor)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(boleto.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => copiarCodigoBarras(boleto.barcode)}
                                  title="Copiar código de barras"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                {boleto.pdfUrl && (
                                  <a 
                                    href={boleto.pdfUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    title="Baixar boleto"
                                  >
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  </a>
                                )}
                                {boleto.boletoUrl && (
                                  <a 
                                    href={boleto.boletoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    title="Visualizar boleto"
                                  >
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                        Anterior
                      </Button>
                      
                      <div className="text-xs text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8"
                      >
                        Próxima
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegracaoBoleto;
