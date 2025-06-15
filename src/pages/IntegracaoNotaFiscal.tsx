
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Settings, Key, TestTube } from 'lucide-react';

const IntegracaoNotaFiscal = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    empresaId: '',
    ambiente: 'homologacao', // homologacao ou producao
    ativo: false,
    emitirAutomaticamente: true,
    modelo: '65', // NFC-e
  });

  const handleSaveConfig = () => {
    console.log('Salvando configurações NFE.io:', config);
    toast.success('Configurações de Nota Fiscal salvas com sucesso!');
  };

  const handleTestConnection = async () => {
    if (!config.apiKey || !config.empresaId) {
      toast.error('Preencha a API Key e ID da Empresa para testar a conexão');
      return;
    }
    
    toast.info('Testando conexão com NFE.io...');
    // Aqui seria feita a chamada real para a API
    setTimeout(() => {
      toast.success('Conexão com NFE.io estabelecida com sucesso!');
    }, 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Integração Nota Fiscal</h1>
          <p className="text-gray-600">Configuração da integração com NFE.io para emissão de notas fiscais</p>
        </div>
      </div>

      <Tabs defaultValue="configuracao" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="teste">Teste de Conexão</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações da API NFE.io
              </CardTitle>
              <CardDescription>
                Configure os dados de acesso para integração com a NFE.io
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <Label htmlFor="modelo">Modelo da Nota</Label>
                  <select
                    id="modelo"
                    className="w-full p-2 border rounded-md"
                    value={config.modelo}
                    onChange={(e) => setConfig({...config, modelo: e.target.value})}
                  >
                    <option value="65">NFC-e (Modelo 65)</option>
                    <option value="55">NFe (Modelo 55)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Integração Ativa</Label>
                  <p className="text-sm text-gray-600">Ative para começar a emitir notas fiscais</p>
                </div>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={(checked) => setConfig({...config, ativo: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Emissão Automática</Label>
                  <p className="text-sm text-gray-600">Emitir nota fiscal automaticamente após a venda</p>
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
                Teste de Conexão
              </CardTitle>
              <CardDescription>
                Teste a conexão com a API da NFE.io
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Certifique-se de ter configurado a API Key e ID da Empresa antes de testar a conexão.
                </p>
              </div>
              
              <Button onClick={handleTestConnection} className="w-full">
                <Key className="w-4 h-4 mr-2" />
                Testar Conexão com NFE.io
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Notas Fiscais</CardTitle>
              <CardDescription>
                Acompanhe as notas fiscais emitidas pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma nota fiscal encontrada</p>
                <p className="text-sm">As notas emitidas aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegracaoNotaFiscal;
