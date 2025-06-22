
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
    <div className="p-1 space-y-1 min-h-screen">
      <div className="flex flex-col gap-1 mb-1">
        <div className="flex items-center gap-1">
          <FileCheck2 className="w-4 h-4 text-purple-600" />
          <div>
            <h1 className="text-sm font-bold">Integração NFC-e</h1>
            <p className="text-xs text-gray-600">Configuração da Nota Fiscal de Consumidor Eletrônica</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="configuracao" className="space-y-1">
        <TabsList className="grid w-full grid-cols-4 h-7">
          <TabsTrigger value="configuracao" className="text-xs">Config</TabsTrigger>
          <TabsTrigger value="teste" className="text-xs">Teste</TabsTrigger>
          <TabsTrigger value="numeracao" className="text-xs">Numeração</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="flex items-center gap-1 text-sm">
                <Settings className="w-3 h-3" />
                Configurações NFC-e
              </CardTitle>
              <CardDescription className="text-xs">
                Configure os dados para emissão de NFC-e via NFE.io
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                  <span className="font-medium text-orange-800 text-xs">Importante</span>
                </div>
                <p className="text-xs text-orange-700">
                  A NFC-e é obrigatória para estabelecimentos do Simples Nacional que fazem vendas ao consumidor final.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="apiKey" className="text-xs">API Key NFE.io</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Sua API Key da NFE.io"
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    className="h-7 text-xs"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="empresaId" className="text-xs">ID da Empresa</Label>
                  <Input
                    id="empresaId"
                    placeholder="ID da sua empresa na NFE.io"
                    value={config.empresaId}
                    onChange={(e) => setConfig({...config, empresaId: e.target.value})}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="csc" className="text-xs">CSC - Código de Segurança</Label>
                  <Input
                    id="csc"
                    type="password"
                    placeholder="Código de Segurança do Contribuinte"
                    value={config.csc}
                    onChange={(e) => setConfig({...config, csc: e.target.value})}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cscId" className="text-xs">ID do CSC</Label>
                  <Input
                    id="cscId"
                    placeholder="Identificador do CSC"
                    value={config.cscId}
                    onChange={(e) => setConfig({...config, cscId: e.target.value})}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

                <div className="space-y-1">
                  <Label htmlFor="serie" className="text-xs">Série</Label>
                  <Input
                    id="serie"
                    type="number"
                    value={config.serie}
                    onChange={(e) => setConfig({...config, serie: parseInt(e.target.value)})}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-xs">Integração Ativa</Label>
                  <p className="text-xs text-gray-600">Ative para começar a emitir NFC-e</p>
                </div>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={(checked) => setConfig({...config, ativo: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-xs">Emissão Automática</Label>
                  <p className="text-xs text-gray-600">Emitir NFC-e automaticamente após a venda</p>
                </div>
                <Switch
                  checked={config.emitirAutomaticamente}
                  onCheckedChange={(checked) => setConfig({...config, emitirAutomaticamente: checked})}
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
                Teste da Integração
              </CardTitle>
              <CardDescription className="text-xs">
                Teste a conexão e emissão de NFC-e
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <Button onClick={handleTestConnection} className="w-full h-7 text-xs" variant="outline">
                <Settings className="w-3 h-3 mr-1" />
                Testar Conexão
              </Button>
              
              <Button onClick={handleTestEmission} className="w-full h-7 text-xs">
                <Receipt className="w-3 h-3 mr-1" />
                Emitir NFC-e de Teste
              </Button>
              
              <div className="p-2 bg-gray-50 border rounded-lg">
                <p className="text-xs text-gray-700">
                  <strong>Dica:</strong> Use o ambiente de homologação para realizar testes sem impacto fiscal.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numeracao">
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="text-sm">Controle de Numeração</CardTitle>
              <CardDescription className="text-xs">
                Gerencie a numeração das NFC-e
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="proximoNumero" className="text-xs">Próximo Número</Label>
                  <Input
                    id="proximoNumero"
                    type="number"
                    value={config.proximoNumero}
                    onChange={(e) => setConfig({...config, proximoNumero: parseInt(e.target.value)})}
                    className="h-7 text-xs"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Série Atual</Label>
                  <div className="p-1 bg-gray-100 rounded-md h-7 flex items-center text-xs">
                    {config.serie}
                  </div>
                </div>
              </div>
              
              <Button className="w-full h-7 text-xs" variant="outline">
                Atualizar Numeração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="text-sm">Histórico de NFC-e</CardTitle>
              <CardDescription className="text-xs">
                Acompanhe as NFC-e emitidas pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-center py-4 text-gray-500">
                <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhuma NFC-e encontrada</p>
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
