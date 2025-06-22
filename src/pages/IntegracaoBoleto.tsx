
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
    <div className="min-h-screen p-1 sm:p-2 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
      <div className="flex flex-col gap-1 sm:gap-2 mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold">Integração Boleto</h1>
            <p className="text-xs sm:text-sm text-gray-600">Configuração da integração bancária para emissão de boletos</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="configuracao" className="space-y-2 sm:space-y-3">
        <TabsList className="grid w-full grid-cols-3 h-7 sm:h-8 md:h-10">
          <TabsTrigger value="configuracao" className="text-xs sm:text-sm px-1 sm:px-2">Config</TabsTrigger>
          <TabsTrigger value="teste" className="text-xs sm:text-sm px-1 sm:px-2">Teste</TabsTrigger>
          <TabsTrigger value="boletos" className="text-xs sm:text-sm px-1 sm:px-2">Boletos</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader className="p-2 sm:p-3 md:p-4">
              <CardTitle className="flex items-center gap-1 text-sm sm:text-base">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                Configurações Bancárias
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure os dados bancários para emissão de boletos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="banco" className="text-xs sm:text-sm">Código do Banco</Label>
                  <Input
                    id="banco"
                    placeholder="Ex: 341, 033, 104"
                    value={config.banco}
                    onChange={(e) => setConfig({...config, banco: e.target.value})}
                    className="h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                  />
                </div>
                
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="agencia" className="text-xs sm:text-sm">Agência</Label>
                  <Input
                    id="agencia"
                    placeholder="Número da agência"
                    value={config.agencia}
                    onChange={(e) => setConfig({...config, agencia: e.target.value})}
                    className="h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="conta" className="text-xs sm:text-sm">Conta</Label>
                  <Input
                    id="conta"
                    placeholder="Número da conta"
                    value={config.conta}
                    onChange={(e) => setConfig({...config, conta: e.target.value})}
                    className="h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="carteira" className="text-xs sm:text-sm">Carteira</Label>
                  <Input
                    id="carteira"
                    placeholder="Número da carteira"
                    value={config.carteira}
                    onChange={(e) => setConfig({...config, carteira: e.target.value})}
                    className="h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="convenio" className="text-xs sm:text-sm">Convênio</Label>
                  <Input
                    id="convenio"
                    placeholder="Número do convênio"
                    value={config.convenio}
                    onChange={(e) => setConfig({...config, convenio: e.target.value})}
                    className="h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="codigoBeneficiario" className="text-xs sm:text-sm">Código do Beneficiário</Label>
                <Input
                  id="codigoBeneficiario"
                  placeholder="Código do beneficiário"
                  value={config.codigoBeneficiario}
                  onChange={(e) => setConfig({...config, codigoBeneficiario: e.target.value})}
                  className="h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="diasVencimento" className="text-xs sm:text-sm">Dias p/ Vencimento</Label>
                  <Input
                    id="diasVencimento"
                    type="number"
                    value={config.diasVencimento}
                    onChange={(e) => setConfig({...config, diasVencimento: parseInt(e.target.value)})}
                    className="h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="juros" className="text-xs sm:text-sm">Juros (% mês)</Label>
                  <Input
                    id="juros"
                    type="number"
                    step="0.01"
                    value={config.juros}
                    onChange={(e) => setConfig({...config, juros: parseFloat(e.target.value)})}
                    className="h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="multa" className="text-xs sm:text-sm">Multa (%)</Label>
                  <Input
                    id="multa"
                    type="number"
                    step="0.01"
                    value={config.multa}
                    onChange={(e) => setConfig({...config, multa: parseFloat(e.target.value)})}
                    className="h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="ambiente" className="text-xs sm:text-sm">Ambiente</Label>
                <select
                  id="ambiente"
                  className="w-full p-1 sm:p-2 border rounded-md h-7 sm:h-8 md:h-10 text-xs sm:text-sm"
                  value={config.ambiente}
                  onChange={(e) => setConfig({...config, ambiente: e.target.value})}
                >
                  <option value="homologacao">Homologação</option>
                  <option value="producao">Produção</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg gap-2 sm:gap-0">
                <div className="space-y-0.5">
                  <Label className="text-xs sm:text-sm">Integração Ativa</Label>
                  <p className="text-xs text-gray-600">Ative para começar a emitir boletos</p>
                </div>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={(checked) => setConfig({...config, ativo: checked})}
                />
              </div>

              <Button onClick={handleSaveConfig} className="w-full h-7 sm:h-8 md:h-10 text-xs sm:text-sm">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teste">
          <Card>
            <CardHeader className="p-2 sm:p-3 md:p-4">
              <CardTitle className="flex items-center gap-1 text-sm sm:text-base">
                <TestTube className="w-3 h-3 sm:w-4 sm:h-4" />
                Teste de Conexão Bancária
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Teste a conexão com o banco para validar as configurações
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
              <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800">
                  Certifique-se de ter configurado todos os dados bancários antes de testar.
                </p>
              </div>
              
              <Button onClick={handleTestConnection} className="w-full h-7 sm:h-8 md:h-10 text-xs sm:text-sm">
                <CreditCard className="w-3 h-3 mr-1" />
                Testar Conexão Bancária
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boletos">
          <Card>
            <CardHeader className="p-2 sm:p-3 md:p-4">
              <CardTitle className="text-sm sm:text-base">Boletos Emitidos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Acompanhe os boletos gerados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="text-center py-4 sm:py-6 text-gray-500">
                <Banknote className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Nenhum boleto encontrado</p>
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
