
import React, { useState } from 'react';
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
// jsPDF é carregado globalmente via CDN
declare global {
  interface Window {
    jsPDF: {
      new (): {
        setFontSize(size: number): void;
        setFont(fontName: string, fontStyle?: string, fontWeight?: string | number): void;
        text(text: string | string[], x: number, y: number, options?: { align?: string }): void;
        setLineWidth(width: number): void;
        line(x1: number, y1: number, x2: number, y2: number, style?: { width?: number; color?: string }): void;
        save(filename: string): void;
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
  nome: string;
  preco: number;
  categoria: string;
}

interface CancelamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
}

const CancelamentoModal: React.FC<CancelamentoModalProps> = ({
  isOpen,
  onClose,
  produto,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto || !formData.numero_pedido || !formData.motivo) return;

    try {
      setLoading(true);
      
      const cancelamento = {
        numero_pedido: formData.numero_pedido,
        motivo: formData.motivo,
        valor_cancelado: parseFloat(formData.valor_cancelado) || 0,
        cliente_nome: formData.cliente_nome,
        produto_nome: produto.nome,
        observacoes: formData.observacoes,
      };

      // Cria o cancelamento no banco de dados
      const result = await criarCancelamento(cancelamento);
      
      if (!result) {
        throw new Error('Nenhum resultado retornado ao criar o cancelamento');
      }
      
      if ('error' in result) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Erro desconhecido ao criar cancelamento');
      }

      // Gera o comprovante de cancelamento
      try {
        const doc = new window.jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let yPos = 20;
        
        // Cabeçalho
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPROVANTE DE CANCELAMENTO', pageWidth / 2, yPos, { align: 'center' } as any);
        yPos += 15;
        
        // Linha divisória
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;
        
        // Conteúdo
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        // Função para adicionar campo
        const addField = (label: string, value: string) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`${label}:`, margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(value, margin + 60, yPos);
          yPos += 10;
        };
        
        // Adiciona os campos
        addField('Número do Pedido', cancelamento.numero_pedido || 'N/A');
        addField('Produto', cancelamento.produto_nome || 'N/A');
        addField('Valor', `R$ ${Number(cancelamento.valor_cancelado || 0).toFixed(2).replace('.', ',')}`);
        addField('Motivo', cancelamento.motivo || 'N/A');
        addField('Data', new Date().toLocaleString('pt-BR'));
        
        // Rodapé
        yPos = doc.internal.pageSize.getHeight() - 20;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
doc.text('Este é um documento gerado automaticamente.', pageWidth / 2, yPos, { align: 'center' } as any);
        
        // Salva o PDF
        doc.save(`cancelamento-${cancelamento.numero_pedido || 'sem-numero'}.pdf`);
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        toast.error('Ocorreu um erro ao gerar o comprovante.');
      }

      // Redireciona para a página de cancelamentos
      navigate('/cancelamentos');
      
      // Fecha o modal após um pequeno delay para dar tempo do redirecionamento
      setTimeout(() => onClose(), 300);
      
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
