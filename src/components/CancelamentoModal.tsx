
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCancelamentos } from '@/hooks/useCancelamentos';
import { Loader2, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Função para gerar código de autorização aleatório
const gerarCodigoAutorizacao = () => {
  // Gera um código de 6 dígitos numéricos
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// jsPDF é carregado globalmente via CDN
declare global {
  interface Window {
    jsPDF: {
      new (): {
        setFontSize(size: number): void;
        setFont(fontName: string, fontStyle?: string, fontWeight?: string | number): void;
        text(text: string | string[], x: number, y: number, options?: { align?: string }): void;
        setLineWidth(width: number): void;
        setDrawColor(color: number): void;
        setLineDash(dashArray: number[], dashPhase?: number): void;
        line(x1: number, y1: number, x2: number, y2: number, style?: { width?: number; color?: string }): void;
        save(filename: string): void;
        output(type: string, options?: any): any;
        internal: {
          pageSize: {
            getWidth(): number;
            getHeight(): number;
          };
        };
      };
    };
  }
}

interface Produto {
  id: string;
  nome: string; // Agora é obrigatório
  preco: number;
  categoria: string;
  numero_pedido?: string;
}

interface CancelamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  modoVisualizacao?: boolean;
  onPrintComplete?: () => void;
}

const CancelamentoModal: React.FC<CancelamentoModalProps> = ({
  isOpen,
  onClose,
  produto,
  modoVisualizacao = false,
  onPrintComplete,
}) => {
  const { criarCancelamento } = useCancelamentos();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero_pedido: '',
    motivo: '',
    valor_cancelado: produto?.preco.toString() || '',
    cliente_nome: '',
    observacoes: '',
  });

  // Se estiver em modo de visualização, preenche o formulário com dados do cancelamento
  useEffect(() => {
    if (produto) {
      setFormData({
        numero_pedido: produto.numero_pedido || '',
        motivo: modoVisualizacao ? 'Venda cancelada anteriormente' : '',
        valor_cancelado: produto.preco.toString(),
        cliente_nome: modoVisualizacao ? 'Cliente não especificado' : '',
        observacoes: modoVisualizacao 
          ? `Cancelamento realizado em ${new Date().toLocaleString('pt-BR')}` 
          : '',
      });
    }
  }, [modoVisualizacao, produto]);

  const gerarComprovantePDF = (dados: any) => {
    const doc = new window.jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let yPos = 10;
    
    // Cabeçalho - Logo e Título
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MARIA PASS', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RUA JOAO DA SILVA, 123 - CENTRO', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 5;
    doc.text('SÃO PAULO - SP - 01234-567', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 5;
    doc.text('CNPJ: 12.345.678/0001-90', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 10;
    
    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    // Título do Comprovante
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE CANCELAMENTO', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 10;
    
    // Linha divisória
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    // Data e Hora
    const now = new Date();
    const dataHora = now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data/Hora: ${dataHora}`, margin, yPos);
    yPos += 6;
    
    // Número do Cupom
    doc.text(`Cupom Nº: ${dados.numero_pedido || 'N/A'}`, margin, yPos);
    yPos += 8;
    
    // Linha divisória pontilhada
    doc.setLineWidth(0.2);
    doc.setDrawColor(150);
    doc.setLineDash([2, 2], 0);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.setLineDash([], 0);
    yPos += 8;
    
    // Itens do Cancelamento
    doc.setFont('helvetica', 'bold');
    doc.text('CANCELAMENTO', margin, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Valor: R$ ${Number(dados.valor_cancelado || 0).toFixed(2).replace('.', ',')}`, margin, yPos);
    yPos += 6;
    
    doc.text(`Motivo: ${dados.motivo || 'N/A'}`, margin, yPos);
    yPos += 6;
    
    // Código de autorização
    doc.text(`Cód. Autorização: ${dados.codigo_autorizacao || 'N/A'}`, margin, yPos);
    yPos += 10;
    
    // Linha divisória pontilhada
    doc.setLineWidth(0.2);
    doc.setDrawColor(150);
    doc.setLineDash([2, 2], 0);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.setLineDash([], 0);
    yPos += 8;
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL CANCELADO: R$ ${Number(dados.valor_cancelado || 0).toFixed(2).replace('.', ',')}`, margin, yPos);
    yPos += 10;
    
    // Mensagem de agradecimento
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Obrigado pela preferência!', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 5;
    doc.text('Volte sempre!', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 10;
    
    // Rodapé
    doc.setFontSize(7);
    doc.text('Desenvolvido por: MARIA PASS TECNOLOGIA', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 5;
    doc.text('CNPJ: 12.345.678/0001-90', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 5;
    doc.text('Sistema de automação comercial', pageWidth / 2, yPos, { align: 'center' } as any);
    
    return doc;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto || !formData.numero_pedido || !formData.motivo) return;

    try {
      setLoading(true);
      
      // Gera o código de autorização
      const codigoAutorizacao = gerarCodigoAutorizacao();
      
      const dadosCancelamento = {
        numero_pedido: formData.numero_pedido,
        motivo: formData.motivo,
        valor_cancelado: parseFloat(formData.valor_cancelado) || 0,
        cliente_nome: formData.cliente_nome,
        produto_nome: produto?.nome || 'Produto não identificado', // Garante que sempre teremos um valor
        observacoes: formData.observacoes,
        data_cancelamento: new Date().toISOString(),
        codigo_autorizacao: codigoAutorizacao,
      };

      if (!modoVisualizacao) {
        // Cria o cancelamento no banco de dados apenas se não for modo de visualização
        const result = await criarCancelamento(dadosCancelamento);
        if (!result) throw new Error('Nenhum resultado retornado ao criar o cancelamento');
        if ('error' in result) throw new Error(typeof result.error === 'string' ? result.error : 'Erro desconhecido ao criar cancelamento');
        
        // Redireciona imediatamente após o cancelamento ser criado com sucesso
        onClose();
        navigate('/cancelamentos');
        toast.success('Cancelamento realizado com sucesso!');
      }

      // Gera o PDF em segundo plano sem bloquear o redirecionamento
      try {
        const doc = gerarComprovantePDF(dadosCancelamento);
        
        // Salva o PDF
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Abre o PDF em uma nova aba
        window.open(pdfUrl, '_blank');
        
        // Força o download do PDF
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `comprovante-cancelamento-${dadosCancelamento.numero_pedido || 'sem-numero'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Notifica o componente pai que o PDF foi gerado
        if (onPrintComplete) {
          onPrintComplete();
        }
        
        // Se for modo de visualização, fecha o modal após um pequeno delay
        if (modoVisualizacao) {
          toast.success('Comprovante gerado com sucesso!');
          setTimeout(() => onClose(), 1000);
        }
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        toast.error('Ocorreu um erro ao gerar o comprovante.');
      }
      
      // Reset form and close modal
      setFormData({
        numero_pedido: '',
        motivo: '',
        valor_cancelado: produto?.preco.toString() || '',
        cliente_nome: '',
        observacoes: '',
      });
      
      toast.success('Cancelamento realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar cancelamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      numero_pedido: '',
      motivo: '',
      valor_cancelado: produto?.preco.toString() || '',
      cliente_nome: '',
      observacoes: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-destructive" />
            Comprovante de Cancelamento
          </DialogTitle>
        </DialogHeader>


        
        {produto && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Produto</Label>
              <Input value={produto.nome} disabled className="bg-gray-50" />
            </div>

            <div>
              <Label htmlFor="numero_pedido">Número do Pedido *</Label>
              <Input
                id="numero_pedido"
                value={formData.numero_pedido}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_pedido: e.target.value }))}
                placeholder="Ex: PED001, #123456..."
                required
              />
            </div>

            <div>
              <Label htmlFor="cliente_nome">Nome do Cliente</Label>
              <Input
                id="cliente_nome"
                value={formData.cliente_nome}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                placeholder="Nome do cliente (opcional)"
              />
            </div>

            <div>
              <Label htmlFor="valor_cancelado">Valor do Cancelamento (R$) *</Label>
              <Input
                id="valor_cancelado"
                type="number"
                step="0.01"
                value={formData.valor_cancelado}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_cancelado: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="motivo">Motivo do Cancelamento *</Label>
              <Input
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                placeholder="Ex: Produto defeituoso, erro no pedido..."
                required
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Informações adicionais sobre o cancelamento..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.numero_pedido || !formData.motivo}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Solicitar Cancelamento'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CancelamentoModal;
