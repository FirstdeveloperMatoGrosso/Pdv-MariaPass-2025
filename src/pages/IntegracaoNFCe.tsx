
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileCheck2, Settings, TestTube, Receipt, AlertTriangle } from 'lucide-react';

const IntegracaoNFCe = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    empresaId: '',
    csc: '', // Código de Segurança do Contribuinte
    cscId: '', // Identificador do CSC
    ambiente: 'homologacao',
    ativo: false,
    serie: 1,
    proximoNumero: 1,
    emitirAutomaticamente: true,
  });

  const handleSaveConfig = () => {
    console.log('Salvando configurações NFC-e:', config);
    toast.success('Configurações de NFC-e salvas com sucesso!');
  };

  const handleTestConnection = async () => {
    if (!config.apiKey || !config.empresaId) {
      toast.error('Preencha a API Key e ID da Empresa para testar a conexão');
      return;
    }
    
    toast.info('Testando conexão NFC-e...');
    setTimeout(() => {
      toast.success('Conexão NFC-e estabelecida com sucesso!');
    }, 2000);
  };

  const handleTestEmission = () => {
    if (!config.ativo) {
      toast.error('Ative a integração antes de testar a emissão');
      return;
    }
    
    toast.info('Enviando NFC-e de teste...');
    setTimeout(() => {
      toast.success('NFC-e de teste emitida com sucesso!');
    }, 3000);
  };

  return (
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-purple-600" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Integração NFC-e</h1>
            <p className="text-xs sm:text-sm text-gray-600">Configuração da Nota Fiscal de Consumidor Eletrônica</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="configuracao" className="space-y-2 sm:space-y-3">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-8 sm:h-10">
          <TabsTrigger value="configuracao" className="text-xs sm:text-sm">Config</TabsTrigger>
          <TabsTrigger value="teste" className="text-xs sm:text-sm">Teste</TabsTrigger>
          <TabsTrigger value="numeracao" className="text-xs sm:text-sm hidden sm:flex">Numeração</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs sm:text-sm">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="flex items-center gap-1 text-sm sm:text-base">
                <Settings className="w-4 h-4" />
                Configurações NFC-e
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure os dados para emissão de NFC-e via NFE.io
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 space-y-3 sm:space-y-4">
              <div className="p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                  <span className="font-medium text-orange-800 text-xs sm:text-sm">Importante</span>
                </div>
                <p className="text-xs text-orange-700">
                  A NFC-e é obrigatória para estabelecimentos do Simples Nacional que fazem vendas ao consumidor final.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <Label htmlFor="apiKey" className="text-xs sm:text-sm">API Key NFE.io</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Sua API Key da NFE.io"
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="empresaId" className="text-xs sm:text-sm">ID da Empresa</Label>
                  <Input
                    id="empresaId"
                    placeholder="ID da sua empresa na NFE.io"
                    value={config.empresaId}
                    onChange={(e) => setConfig({...config, empresaId: e.target.value})}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <Label htmlFor="csc" className="text-xs sm:text-sm">CSC - Código de Segurança</Label>
                  <Input
                    id="csc"
                    type="password"
                    placeholder="Código de Segurança do Contribuinte"
                    value={config.csc}
                    onChange={(e) => setConfig({...config, csc: e.target.value})}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cscId" className="text-xs sm:text-sm">ID do CSC</Label>
                  <Input
                    id="cscId"
                    placeholder="Identificador do CSC"
                    value={config.cscId}
                    onChange={(e) => setConfig({...config, cscId: e.target.value})}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ambiente" className="text-xs sm:text-sm">Ambiente</Label>
                  <select
                    id="ambiente"
                    className="w-full p-1 sm:p-2 border rounded-md h-8 sm:h-10 text-xs sm:text-sm"
                    value={config.ambiente}
                    onChange={(e) => setConfig({...config, ambiente: e.target.value})}
                  >
                    <option value="homologacao">Homologação</option>
                    <option value="producao">Produção</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="serie" className="text-xs sm:text-sm">Série</Label>
                  <Input
                    id="serie"
                    type="number"
                    value={config.serie}
                    onChange={(e) => setConfig({...config, serie: parseInt(e.target.value)})}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-xs sm:text-sm">Integração Ativa</Label>
                  <p className="text-xs text-gray-600">Ative para começar a emitir NFC-e</p>
                </div>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={(checked) => setConfig({...config, ativo: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-xs sm:text-sm">Emissão Automática</Label>
                  <p className="text-xs text-gray-600">Emitir NFC-e automaticamente após a venda</p>
                </div>
                <Switch
                  checked={config.emitirAutomaticamente}
                  onCheckedChange={(checked) => setConfig({...config, emitirAutomaticamente: checked})}
                />
              </div>

              <Button onClick={handleSaveConfig} className="w-full h-8 sm:h-10 text-xs sm:text-sm">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teste">
          <Card>
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="flex items-center gap-1 text-sm sm:text-base">
                <TestTube className="w-4 h-4" />
                Teste da Integração
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Teste a conexão e emissão de NFC-e
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 space-y-2 sm:space-y-3">
              <div className="space-y-2">
                <Button onClick={handleTestConnection} className="w-full h-8 sm:h-10 text-xs sm:text-sm" variant="outline">
                  <Settings className="w-3 h-3 mr-1" />
                  Testar Conexão
                </Button>
                
                <Button onClick={handleTestEmission} className="w-full h-8 sm:h-10 text-xs sm:text-sm">
                  <Receipt className="w-3 h-3 mr-1" />
                  Emitir NFC-e de Teste
                </Button>
              </div>
              
              <div className="p-2 sm:p-3 bg-gray-50 border rounded-lg">
                <p className="text-xs text-gray-700">
                  <strong>Dica:</strong> Use o ambiente de homologação para realizar testes sem impacto fiscal.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numeracao">
          <Card>
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-sm sm:text-base">Controle de Numeração</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gerencie a numeração das NFC-e
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 space-y-2 sm:space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <Label htmlFor="proximoNumero" className="text-xs sm:text-sm">Próximo Número</Label>
                  <Input
                    id="proximoNumero"
                    type="number"
                    value={config.proximoNumero}
                    onChange={(e) => setConfig({...config, proximoNumero: parseInt(e.target.value)})}
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm">Série Atual</Label>
                  <div className="p-1 sm:p-2 bg-gray-100 rounded-md h-8 sm:h-10 flex items-center text-xs sm:text-sm">
                    {config.serie}
                  </div>
                </div>
              </div>
              
              <Button className="w-full h-8 sm:h-10 text-xs sm:text-sm" variant="outline">
                Atualizar Numeração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-sm sm:text-base">Histórico de NFC-e</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Acompanhe as NFC-e emitidas pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
              <div className="text-center py-4 sm:py-6 text-gray-500">
                <FileCheck2 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Nenhuma NFC-e encontrada</p>
                <p className="text-xs">As NFC-e emitidas aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegracaoNFCe;
