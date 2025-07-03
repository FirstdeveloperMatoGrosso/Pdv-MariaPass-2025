import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, X, User, Mail, FileText, DollarSign, Calendar, Search } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import { BuscarCliente } from '@/components/BuscarCliente';
import { paymentService } from '@/services/paymentService';
import type { BoletoPaymentData, PagarmeCustomerData } from '@/services/paymentService';

interface NovaVendaBoletoProps {
  onBoletoGerado: (boleto: any) => void;
  config: {
    diasVencimento: number;
    juros: number;
    multa: number;
  };
}

const NovaVendaBoleto: React.FC<NovaVendaBoletoProps> = ({ onBoletoGerado, config }) => {
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState({
    id: '',
    nome: '',
    email: '',
    documento: '',
    telefone: '',
    tipo: 'PF' as 'PF' | 'PJ',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: ''
    }
  });
  const [venda, setVenda] = useState({
    descricao: 'Venda de Produto/Serviço',
    valor: '',
    dataVencimento: format(addDays(new Date(), config.diasVencimento), 'yyyy-MM-dd'),
    observacao: ''
  });

  // Função para preencher os dados do cliente selecionado
  const handleClienteSelecionado = (clienteSelecionado: any) => {
    // Remove formatação do documento (pontos, barras e hífens)
    const documentoLimpo = clienteSelecionado.documento.replace(/\D/g, '');
    
    setCliente({
      id: clienteSelecionado.id,
      nome: clienteSelecionado.nome,
      email: clienteSelecionado.email || '',
      documento: documentoLimpo, // Armazena apenas números
      telefone: clienteSelecionado.telefone || '',
      tipo: clienteSelecionado.tipo,
      endereco: {
        logradouro: clienteSelecionado.endereco?.logradouro || '',
        numero: clienteSelecionado.endereco?.numero || '',
        complemento: clienteSelecionado.endereco?.complemento || '',
        bairro: clienteSelecionado.endereco?.bairro || '',
        cidade: clienteSelecionado.endereco?.cidade || '',
        uf: clienteSelecionado.endereco?.uf || '',
        cep: clienteSelecionado.endereco?.cep || ''
      }
    });
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('endereco.')) {
      const field = name.split('.')[1] as keyof typeof cliente.endereco;
      setCliente(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [field]: value
        }
      }));
    } else {
      setCliente(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleVendaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVenda({
      ...venda,
      [name]: value
    });
  };

  const formatarTelefone = (telefone: string) => {
    const apenasNumeros = telefone.replace(/\D/g, '');
    if (apenasNumeros.length <= 10) {
      return apenasNumeros
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return apenasNumeros
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d{4})/, '$1-$2');
    }
  };

  const formatarCEP = (cep: string) => {
    return cep.replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const validarDados = () => {
    if (!cliente.nome.trim()) {
      toast.error('Informe o nome do cliente');
      return false;
    }
    if (!cliente.email.trim()) {
      toast.error('Informe o e-mail do cliente');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
      toast.error('Informe um e-mail válido');
      return false;
    }
    if (!cliente.documento.trim()) {
      toast.error('Informe o CPF/CNPJ do cliente');
      return false;
    }
    const documentoLimpo = cliente.documento.replace(/\D/g, '');
    if (documentoLimpo.length !== 11 && documentoLimpo.length !== 14) {
      toast.error('CPF deve ter 11 dígitos ou CNPJ 14 dígitos');
      return false;
    }
    if (!venda.descricao.trim()) {
      toast.error('Informe a descrição da venda');
      return false;
    }
    const valorNumerico = parseFloat(venda.valor.replace(/\./g, '').replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Informe um valor válido para a venda');
      return false;
    }
    return true;
  };

  const handleGerarBoleto = async () => {
    if (!validarDados()) return;
    setLoading(true);
    try {
      const documentoLimpo = cliente.documento.replace(/\D/g, '');
      const isCpf = documentoLimpo.length === 11;
      const documentType = isCpf ? 'CPF' : 'CNPJ' as const;

      const enderecoCliente = {
        line_1: `${cliente.endereco.logradouro}, ${cliente.endereco.numero}`,
        line_2: cliente.endereco.complemento,
        zip_code: cliente.endereco.cep.replace(/\D/g, ''),
        city: cliente.endereco.cidade,
        state: cliente.endereco.uf,
        country: 'BR' as const
      };

      const telefoneCliente = {
        mobile_phone: {
          country_code: '55',
          area_code: cliente.telefone.replace(/\D/g, '').substring(0, 2) || '00',
          number: cliente.telefone.replace(/\D/g, '').substring(2) || '00000000'
        }
      };

      const metadataCliente = {
        origem: 'pdv-integração-boleto',
        data_cadastro: new Date().toISOString()
      };

      const customerData: PagarmeCustomerData = {
        name: cliente.nome,
        email: cliente.email || 'email@exemplo.com',
        document: documentoLimpo,
        document_type: isCpf ? 'CPF' : 'CNPJ',
        type: isCpf ? 'individual' : 'company',
        phones: telefoneCliente,
        address: enderecoCliente,
        metadata: metadataCliente
      };

      const valorNumerico = parseFloat(venda.valor.replace(/\./g, '').replace(',', '.'));

      const itemsVenda = [{
        amount: Math.round(valorNumerico * 100),
        description: venda.descricao,
        quantity: 1
      }];

      const boletoData: BoletoPaymentData = {
        amount: Math.round(valorNumerico * 100),
        customer: customerData,
        orderCode: `BOL-${Date.now()}`,
        dueDate: venda.dataVencimento,
        instructions: venda.observacao || 'Pagar até a data de vencimento',
        items: itemsVenda,
        metadata: {
          origem: 'pdv-integração-boleto',
          data_emissao: new Date().toISOString(),
          juros_dia: config.juros,
          multa_atraso: config.multa
        }
      };

      console.log('Dados para geração do boleto:', boletoData);
      const response = await paymentService.createBoletoPayment(boletoData);
      console.log('Resposta da API:', response);
      toast.success('Boleto gerado com sucesso!');

      const boletoGerado = {
        ...response,
        boletoUrl: response.boletoUrl || response.boleto_url,
        pdfUrl: response.pdfUrl || response.pdf_url,
        dueDate: response.dueDate || response.due_date,
        valor: valorNumerico,
        cliente: cliente.nome,
        documento: cliente.documento,
        descricao: venda.descricao,
        dataEmissao: new Date().toISOString(),
        status: 'pending'
      };

      onBoletoGerado(boletoGerado);

      // Limpar formulário
      setCliente({
        id: '',
        nome: '',
        email: '',
        documento: '',
        telefone: '',
        tipo: 'PF',
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          uf: '',
          cep: ''
        }
      });
      setVenda({
        descricao: 'Venda de Produto/Serviço',
        valor: '',
        dataVencimento: format(addDays(new Date(), config.diasVencimento), 'yyyy-MM-dd'),
        observacao: ''
      });
    } catch (error: any) {
      console.error('Erro ao gerar boleto:', error);
      const errorMessage = error?.response?.data?.message || 'Erro ao gerar boleto. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Nova Venda com Boleto
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dados do Cliente */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Dados do Cliente
              </h3>
              <BuscarCliente onSelect={handleClienteSelecionado}>
                <Button type="button" variant="outline" size="sm" className="space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Buscar Cliente</span>
                </Button>
              </BuscarCliente>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input 
                id="nome" 
                name="nome" 
                value={cliente.nome} 
                onChange={handleClienteChange} 
                placeholder="Nome do cliente" 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documento">CNPJ *</Label>
                <Input
                  id="documento"
                  name="documento"
                  type="number"
                  value={cliente.documento}
                  onChange={(e) => {
                    // Remove qualquer caractere que não seja número
                    const valor = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setCliente(prev => ({
                      ...prev,
                      documento: valor,
                      tipo: 'PJ'
                    }));
                  }}
                  onKeyDown={(e) => {
                    // Permite apenas números e teclas de controle
                    if (!/[0-9]/.test(e.key) && 
                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Digite apenas números"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={cliente.email}
                onChange={(e) => setCliente({...cliente, email: e.target.value})}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="endereco.cep"
                  value={cliente.endereco.cep}
                  onChange={(e) => {
                    const valorFormatado = formatarCEP(e.target.value);
                    setCliente({
                      ...cliente,
                      endereco: { ...cliente.endereco, cep: valorFormatado }
                    });
                  }}
                  placeholder="CEP"
                  className="w-full"
                />
                <Input
                  name="endereco.uf"
                  value={cliente.endereco.uf}
                  onChange={handleClienteChange}
                  placeholder="UF"
                  maxLength={2}
                  className="w-16"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  name="endereco.logradouro"
                  value={cliente.endereco.logradouro}
                  onChange={handleClienteChange}
                  placeholder="Logradouro"
                  className="col-span-2"
                />
                <Input
                  name="endereco.numero"
                  value={cliente.endereco.numero}
                  onChange={handleClienteChange}
                  placeholder="Nº"
                />
              </div>
              <Input
                name="endereco.complemento"
                value={cliente.endereco.complemento}
                onChange={handleClienteChange}
                placeholder="Complemento"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="endereco.bairro"
                  value={cliente.endereco.bairro}
                  onChange={handleClienteChange}
                  placeholder="Bairro"
                />
                <Input
                  name="endereco.cidade"
                  value={cliente.endereco.cidade}
                  onChange={handleClienteChange}
                  placeholder="Cidade"
                />
              </div>
            </div>
          </div>

          {/* Dados da Venda */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Dados da Venda
            </h3>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                name="descricao"
                value={venda.descricao}
                onChange={handleVendaChange}
                placeholder="Ex: Venda de produto/serviço"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  name="valor"
                  value={venda.valor}
                  onChange={(e) => {
                    let valor = e.target.value.replace(/\D/g, '');
                    valor = (Number(valor) / 100).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    });
                    setVenda({ ...venda, valor });
                  }}
                  placeholder="0,00"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataVencimento">Vencimento</Label>
                <div className="relative">
                  <Input
                    id="dataVencimento"
                    name="dataVencimento"
                    type="date"
                    value={venda.dataVencimento}
                    onChange={handleVendaChange}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="pr-8"
                  />
                  <Calendar className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao">Instruções de Pagamento</Label>
              <textarea
                id="observacao"
                name="observacao"
                value={venda.observacao}
                onChange={handleVendaChange}
                placeholder="Ex: Não receber após o vencimento"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium text-blue-800">Configurações do Boleto</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Juros ao dia: {config.juros}%</li>
                <li>• Multa por atraso: {config.multa}%</li>
                <li>• Dias para vencimento padrão: {config.diasVencimento} dias</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleGerarBoleto}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Boleto...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Boleto
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NovaVendaBoleto;