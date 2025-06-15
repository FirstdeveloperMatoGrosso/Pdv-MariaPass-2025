
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
import { Loader2 } from 'lucide-react';

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

export const CancelamentoModal: React.FC<CancelamentoModalProps> = ({
  isOpen,
  onClose,
  produto,
}) => {
  const { criarCancelamento } = useCancelamentos();
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
      await criarCancelamento({
        numero_pedido: formData.numero_pedido,
        motivo: formData.motivo,
        valor_cancelado: Number(formData.valor_cancelado),
        cliente_nome: formData.cliente_nome || 'Cliente não informado',
        produto_nome: produto.nome,
        observacoes: formData.observacoes,
      });

      // Reset form and close modal
      setFormData({
        numero_pedido: '',
        motivo: '',
        valor_cancelado: produto.preco.toString(),
        cliente_nome: '',
        observacoes: '',
      });
      onClose();
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Cancelamento</DialogTitle>
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
