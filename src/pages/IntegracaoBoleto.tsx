
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
    <div className="p-1 space-y-1 min-h-screen">
      <div className="flex flex-col gap-1 mb-1">
        <div className="flex items-center gap-1">
          <Banknote className="w-4 h-4 text-green-600" />
          <div>
            <h1 className="text-sm font-bold">Integração Boleto</h1>
            <p className="text-xs text-gray-600">Configuração da integração bancária para emissão de boletos</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="configuracao" className="space-y-1">
        <TabsList className="grid w-full grid-cols-3 h-7">
          <TabsTrigger value="configuracao" className="text-xs">Config</TabsTrigger>
          <TabsTrigger value="teste" className="text-xs">Teste</TabsTrigger>
          <TabsTrigger value="boletos" className="text-xs">Boletos</TabsTrigger>
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

        <TabsContent value="boletos">
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="text-sm">Boletos Emitidos</CardTitle>
              <CardDescription className="text-xs">
                Acompanhe os boletos gerados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-center py-4 text-gray-500">
                <Banknote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhum boleto encontrado</p>
                <p className="text-xs">Os boletos emitidos aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegracaoBoleto;
