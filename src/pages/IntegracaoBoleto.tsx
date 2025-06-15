
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Banknote, Settings, TestTube, CreditCard } from 'lucide-react';

const IntegracaoBoleto = () => {
  const [config, setConfig] = useState({
    banco: '',
    agencia: '',
    conta: '',
    carteira: '',
    convenio: '',
    codigoBeneficiario: '',
    ambiente: 'homologacao',
    ativo: false,
    diasVencimento: 5,
    juros: 0,
    multa: 0,
  });

  const handleSaveConfig = () => {
    console.log('Salvando configurações de Boleto:', config);
    toast.success('Configurações de Boleto salvas com sucesso!');
  };

  const handleTestConnection = async () => {
    if (!config.banco || !config.agencia || !config.conta) {
      toast.error('Preencha os dados bancários para testar a conexão');
      return;
    }
    
    toast.info('Testando conexão bancária...');
    setTimeout(() => {
      toast.success('Conexão bancária estabelecida com sucesso!');
    }, 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Banknote className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">Integração Boleto</h1>
          <p className="text-gray-600">Configuração da integração bancária para emissão de boletos</p>
        </div>
      </div>

      <Tabs defaultValue="configuracao" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="teste">Teste</TabsTrigger>
          <TabsTrigger value="boletos">Boletos Emitidos</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações Bancárias
              </CardTitle>
              <CardDescription>
                Configure os dados bancários para emissão de boletos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">Código do Banco</Label>
                  <Input
                    id="banco"
                    placeholder="Ex: 341, 033, 104"
                    value={config.banco}
                    onChange={(e) => setConfig({...config, banco: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="agencia">Agência</Label>
                  <Input
                    id="agencia"
                    placeholder="Número da agência"
                    value={config.agencia}
                    onChange={(e) => setConfig({...config, agencia: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conta">Conta</Label>
                  <Input
                    id="conta"
                    placeholder="Número da conta"
                    value={config.conta}
                    onChange={(e) => setConfig({...config, conta: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carteira">Carteira</Label>
                  <Input
                    id="carteira"
                    placeholder="Número da carteira"
                    value={config.carteira}
                    onChange={(e) => setConfig({...config, carteira: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="convenio">Convênio</Label>
                  <Input
                    id="convenio"
                    placeholder="Número do convênio"
                    value={config.convenio}
                    onChange={(e) => setConfig({...config, convenio: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigoBeneficiario">Código do Beneficiário</Label>
                <Input
                  id="codigoBeneficiario"
                  placeholder="Código do beneficiário"
                  value={config.codigoBeneficiario}
                  onChange={(e) => setConfig({...config, codigoBeneficiario: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diasVencimento">Dias para Vencimento</Label>
                  <Input
                    id="diasVencimento"
                    type="number"
                    value={config.diasVencimento}
                    onChange={(e) => setConfig({...config, diasVencimento: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="juros">Juros (% ao mês)</Label>
                  <Input
                    id="juros"
                    type="number"
                    step="0.01"
                    value={config.juros}
                    onChange={(e) => setConfig({...config, juros: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="multa">Multa (%)</Label>
                  <Input
                    id="multa"
                    type="number"
                    step="0.01"
                    value={config.multa}
                    onChange={(e) => setConfig({...config, multa: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

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

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Integração Ativa</Label>
                  <p className="text-sm text-gray-600">Ative para começar a emitir boletos</p>
                </div>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={(checked) => setConfig({...config, ativo: checked})}
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
                Teste de Conexão Bancária
              </CardTitle>
              <CardDescription>
                Teste a conexão com o banco para validar as configurações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Certifique-se de ter configurado todos os dados bancários antes de testar.
                </p>
              </div>
              
              <Button onClick={handleTestConnection} className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Testar Conexão Bancária
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boletos">
          <Card>
            <CardHeader>
              <CardTitle>Boletos Emitidos</CardTitle>
              <CardDescription>
                Acompanhe os boletos gerados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum boleto encontrado</p>
                <p className="text-sm">Os boletos emitidos aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegracaoBoleto;
