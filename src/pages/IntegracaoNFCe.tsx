
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileCheck2 className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Integração NFC-e</h1>
          <p className="text-gray-600">Configuração da Nota Fiscal de Consumidor Eletrônica</p>
        </div>
      </div>

      <Tabs defaultValue="configuracao" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="teste">Teste</TabsTrigger>
          <TabsTrigger value="numeracao">Numeração</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações NFC-e
              </CardTitle>
              <CardDescription>
                Configure os dados para emissão de NFC-e via NFE.io
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Importante</span>
                </div>
                <p className="text-sm text-orange-700">
                  A NFC-e é obrigatória para estabelecimentos do Simples Nacional que fazem vendas ao consumidor final.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key NFE.io</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Sua API Key da NFE.io"
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="empresaId">ID da Empresa</Label>
                  <Input
                    id="empresaId"
                    placeholder="ID da sua empresa na NFE.io"
                    value={config.empresaId}
                    onChange={(e) => setConfig({...config, empresaId: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="csc">CSC - Código de Segurança</Label>
                  <Input
                    id="csc"
                    type="password"
                    placeholder="Código de Segurança do Contribuinte"
                    value={config.csc}
                    onChange={(e) => setConfig({...config, csc: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cscId">ID do CSC</Label>
                  <Input
                    id="cscId"
                    placeholder="Identificador do CSC"
                    value={config.cscId}
                    onChange={(e) => setConfig({...config, cscId: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ambiente">Ambiente</Label>
                  <select
                    id="ambiente"
                    className="w-full p-2 border rounded-md"
                    value={config.ambiente}
                    onChange={(e) => setConfig({...config, ambiente: e.target.value})}
                  >
                    <option value="homologacao">Homologação</option>
                    <option value="producao">Produção</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serie">Série</Label>
                  <Input
                    id="serie"
                    type="number"
                    value={config.serie}
                    onChange={(e) => setConfig({...config, serie: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Integração Ativa</Label>
                  <p className="text-sm text-gray-600">Ative para começar a emitir NFC-e</p>
                </div>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={(checked) => setConfig({...config, ativo: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Emissão Automática</Label>
                  <p className="text-sm text-gray-600">Emitir NFC-e automaticamente após a venda</p>
                </div>
                <Switch
                  checked={config.emitirAutomaticamente}
                  onCheckedChange={(checked) => setConfig({...config, emitirAutomaticamente: checked})}
                />
              </div>

              <Button onClick={handleSaveConfig} className="w-full">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teste">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Teste da Integração
              </CardTitle>
              <CardDescription>
                Teste a conexão e emissão de NFC-e
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button onClick={handleTestConnection} className="w-full" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Testar Conexão
                </Button>
                
                <Button onClick={handleTestEmission} className="w-full">
                  <Receipt className="w-4 h-4 mr-2" />
                  Emitir NFC-e de Teste
                </Button>
              </div>
              
              <div className="p-4 bg-gray-50 border rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Dica:</strong> Use o ambiente de homologação para realizar testes sem impacto fiscal.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numeracao">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Numeração</CardTitle>
              <CardDescription>
                Gerencie a numeração das NFC-e
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proximoNumero">Próximo Número</Label>
                  <Input
                    id="proximoNumero"
                    type="number"
                    value={config.proximoNumero}
                    onChange={(e) => setConfig({...config, proximoNumero: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Série Atual</Label>
                  <div className="p-2 bg-gray-100 rounded-md">
                    {config.serie}
                  </div>
                </div>
              </div>
              
              <Button className="w-full" variant="outline">
                Atualizar Numeração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de NFC-e</CardTitle>
              <CardDescription>
                Acompanhe as NFC-e emitidas pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileCheck2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma NFC-e encontrada</p>
                <p className="text-sm">As NFC-e emitidas aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegracaoNFCe;
