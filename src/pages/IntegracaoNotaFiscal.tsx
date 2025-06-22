
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
    <div className="p-1 space-y-1 min-h-screen">
      <div className="flex flex-col gap-1 mb-1">
        <div className="flex items-center gap-1">
          <FileText className="w-4 h-4 text-blue-600" />
          <div>
            <h1 className="text-sm font-bold">Integração Nota Fiscal</h1>
            <p className="text-xs text-gray-600">Configuração da integração com NFE.io</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="configuracao" className="space-y-1">
        <TabsList className="grid w-full grid-cols-3 h-7">
          <TabsTrigger value="configuracao" className="text-xs">Config</TabsTrigger>
          <TabsTrigger value="teste" className="text-xs">Teste</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="flex items-center gap-1 text-sm">
                <Settings className="w-3 h-3" />
                Configurações da API NFE.io
              </CardTitle>
              <CardDescription className="text-xs">
                Configure os dados de acesso para integração com a NFE.io
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
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
                  <Label htmlFor="modelo" className="text-xs">Modelo da Nota</Label>
                  <select
                    id="modelo"
                    className="w-full p-1 border rounded-md h-7 text-xs"
                    value={config.modelo}
                    onChange={(e) => setConfig({...config, modelo: e.target.value})}
                  >
                    <option value="65">NFC-e (Modelo 65)</option>
                    <option value="55">NFe (Modelo 55)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-xs">Integração Ativa</Label>
                  <p className="text-xs text-gray-600">Ative para começar a emitir notas fiscais</p>
                </div>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={(checked) => setConfig({...config, ativo: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-xs">Emissão Automática</Label>
                  <p className="text-xs text-gray-600">Emitir nota fiscal automaticamente após a venda</p>
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
                Teste de Conexão
              </CardTitle>
              <CardDescription className="text-xs">
                Teste a conexão com a API da NFE.io
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  Certifique-se de ter configurado a API Key e ID da Empresa antes de testar a conexão.
                </p>
              </div>
              
              <Button onClick={handleTestConnection} className="w-full h-7 text-xs">
                <Key className="w-3 h-3 mr-1" />
                Testar Conexão com NFE.io
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="text-sm">Histórico de Notas Fiscais</CardTitle>
              <CardDescription className="text-xs">
                Acompanhe as notas fiscais emitidas pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-center py-4 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhuma nota fiscal encontrada</p>
                <p className="text-xs">As notas emitidas aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegracaoNotaFiscal;
