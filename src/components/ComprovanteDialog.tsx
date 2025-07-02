import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { jsPDF } from 'jspdf';
import { FileText, Printer, Download, Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ComprovanteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    id: string;
    numero_pedido: string;
    cliente_nome?: string;
    valor_cancelado: number;
    motivo: string;
    data_cancelamento: string;
    forma_pagamento?: string;
    codigo_autorizacao?: string;
    estabelecimento?: string;
    endereco_estabelecimento?: string;
    cnpj_estabelecimento?: string;
    operador?: string;
    produto_nome?: string;
    produto_quantidade?: number;
    produto_imagem?: string;
  };
}

export function ComprovanteDialog({ isOpen, onClose, data }: ComprovanteDialogProps) {
  // Dados do comprovante
  const comprovanteData = {
    ...data,
    estabelecimento: data.estabelecimento || 'MARIA PASS',
    endereco_estabelecimento: data.endereco_estabelecimento || 'RUA EXEMPLO, 123 - CENTRO - SÃO PAULO/SP',
    cnpj_estabelecimento: data.cnpj_estabelecimento || '00.000.000/0001-00',
    operador: data.operador || 'OPERADOR',
    codigo_autorizacao: data.codigo_autorizacao || '123456',
    forma_pagamento: data.forma_pagamento || 'PIX',
    data_hora: new Date(data.data_cancelamento).toLocaleString('pt-BR'),
    valor: `R$ ${Number(data.valor_cancelado || 0).toFixed(2).replace('.', ',')}`,
    numero_comprovante: `#${data.numero_pedido || '000000'}`,
    codigo_cancelamento: data.id || 'N/A',
    produto_imagem: data.produto_imagem || '',
  };

  const [tamanhoPapel, setTamanhoPapel] = useState<'58mm' | '80mm'>('80mm');
  const [showConfig, setShowConfig] = useState(false);

  const gerarPDF = (imprimir = false) => {
    const largura = tamanhoPapel === '80mm' ? 80 : 58;
    const altura = 297; // Altura A4 em mm
    const isPequeno = largura === 58;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [largura, altura]
    });
    
    // Configurações baseadas no tamanho do papel
    const margin = isPequeno ? 3 : 5; // Aumentando um pouco a margem para 58mm
    const maxWidth = largura - (margin * 2);
    let yPos = margin + 5; // Adicionando um pequeno espaço no topo

    // Função para adicionar texto centralizado
    const addCenteredText = (text: string, fontSize: number, isBold = false, yOffset = 0) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const textWidth = doc.getTextWidth(text);
      const x = (largura - textWidth) / 2;
      doc.text(text, x, yPos + yOffset);
    };

    // Função para adicionar linha de texto
    const addLine = (text: string, x: number, isBold = false, fontSize = 10) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      // Garante que o texto não ultrapasse a largura máxima
      const textToShow = doc.splitTextToSize(text, maxWidth);
      doc.text(textToShow, x, yPos);
      // Ajusta a posição Y baseado no número de linhas
      if (Array.isArray(textToShow)) {
        yPos += (textToShow.length * (fontSize * 0.4));
      } else {
        yPos += (fontSize * 0.4);
      }
    };

    // Ajusta tamanhos baseado no papel
    const tamanhoFonteTitulo = isPequeno ? 9 : 11;
    const tamanhoFonteSubtitulo = isPequeno ? 8 : 10;
    const tamanhoFonteNormal = isPequeno ? 7 : 9;
    const tamanhoFontePequena = isPequeno ? 6 : 8;
    const tamanhoFonteMinima = isPequeno ? 5 : 6;
    const espacamentoLinha = isPequeno ? 3.5 : 4.5; // Reduzindo um pouco o espaçamento entre linhas

    // Cabeçalho
    doc.setFontSize(tamanhoFonteTitulo);
    doc.setFont('helvetica', 'bold');
    const tituloLines = doc.splitTextToSize(comprovanteData.estabelecimento, maxWidth);
    doc.text(tituloLines, largura / 2, yPos, { align: 'center' } as any);
    yPos += (tituloLines.length * 4) + 2; // Reduzindo o espaçamento após o título

    doc.setFontSize(tamanhoFonteSubtitulo);
    const enderecoLines = doc.splitTextToSize(comprovanteData.endereco_estabelecimento, maxWidth);
    doc.text(enderecoLines, largura / 2, yPos, { align: 'center' } as any);
    yPos += (enderecoLines.length * 3) + 2;

    const cnpjLines = doc.splitTextToSize(`CNPJ: ${comprovanteData.cnpj_estabelecimento}`, maxWidth);
    doc.text(cnpjLines, largura / 2, yPos, { align: 'center' } as any);
    yPos += (cnpjLines.length * 3) + 5;

    // Linha divisória superior
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, largura - margin, yPos);
    yPos += 5; // Aumentando o espaçamento antes do título

    // Título do comprovante
    doc.setFontSize(tamanhoFonteTitulo);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE CANCELAMENTO', largura / 2, yPos, { align: 'center' } as any);
    yPos += 7; // Aumentando o espaçamento após o título

    // Linha divisória inferior
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, largura - margin, yPos);
    yPos += 8; // Aumentando o espaçamento após a linha divisória

    // Detalhes do cancelamento
    doc.setFontSize(tamanhoFonteNormal);
    doc.setFont('helvetica', 'normal');
    // Formata as linhas de informação
    const formatarLinha = (rotulo: string, valor: string) => {
      return `${rotulo}:  ${valor}`;  // Dois espaços adicionais após os dois pontos
    };

    addCenteredText(formatarLinha('DATA/HORA', comprovanteData.data_hora), tamanhoFonteNormal);
    yPos += espacamentoLinha;
    addCenteredText(formatarLinha('NÚMERO', comprovanteData.numero_comprovante), tamanhoFonteNormal);
    yPos += espacamentoLinha;
    
    // Código de cancelamento em duas linhas
    addCenteredText('CÓD. CANCELAMENTO', tamanhoFonteNormal);
    yPos += espacamentoLinha; // Espaço normal entre o rótulo e o código
    addCenteredText(comprovanteData.codigo_cancelamento, tamanhoFonteNormal);
    yPos += espacamentoLinha;
    
    // Informações do produto
    if (comprovanteData.produto_nome) {
      const quantidade = comprovanteData.produto_quantidade || 1;
      
      // Adicionar imagem do produto se existir
      if (comprovanteData.produto_imagem) {
        try {
          // Adiciona um pouco mais de espaço antes da imagem
          yPos += 5;
          
          // Tenta adicionar a imagem diretamente (pode falhar em alguns navegadores)
          try {
            // Define um tamanho máximo para a imagem
            const maxWidth = 40;
            const maxHeight = 40;
            
            // Adiciona a imagem com tamanho fixo (a imagem será escalada mantendo a proporção)
            const x = (largura - maxWidth) / 2;
            doc.addImage(
              comprovanteData.produto_imagem,
              'JPEG',
              x,
              yPos,
              maxWidth,
              maxHeight
            );
            
            // Ajusta a posição Y após a imagem
            yPos += maxHeight + 5;
          } catch (error) {
            console.warn('Não foi possível carregar a imagem do produto:', error);
            // Se não conseguir carregar a imagem, apenas continua sem ela
          }
        } catch (error) {
          console.error('Erro ao carregar a imagem do produto:', error);
        }
      }
      
      addCenteredText(`PRODUTO: ${comprovanteData.produto_nome}`, tamanhoFonteNormal);
      yPos += espacamentoLinha - 1;
      addCenteredText(`QUANTIDADE: ${quantidade}`, tamanhoFonteNormal);
      yPos += espacamentoLinha - 1;
    }
    
    addCenteredText(`OPERADOR: ${comprovanteData.operador}`, tamanhoFonteNormal);
    yPos += espacamentoLinha - 1;
    addCenteredText(`FORMA DE PAGAMENTO: ${comprovanteData.forma_pagamento}`, tamanhoFonteNormal);
    yPos += espacamentoLinha - 1;
    addCenteredText(`CÓD. AUTORIZAÇÃO: ${comprovanteData.codigo_autorizacao}`, tamanhoFonteNormal);
    yPos += espacamentoLinha - 1;

    // Motivo do cancelamento (pode ser longo)
    const motivoLines = doc.splitTextToSize(`MOTIVO: ${comprovanteData.motivo}`, maxWidth - 5);
    doc.text(motivoLines, largura / 2, yPos, { align: 'center' } as any);
    yPos += (motivoLines.length * 3) + 6;

    // Valor cancelado
    doc.setFontSize(tamanhoFonteSubtitulo);
    doc.setFont('helvetica', 'bold');
    addCenteredText('VALOR CANCELADO', tamanhoFonteSubtitulo, true);
    yPos += 4;
    doc.setFontSize(tamanhoFonteTitulo + 2);
    doc.setTextColor(0, 128, 0); // Verde
    addCenteredText(comprovanteData.valor, tamanhoFonteTitulo + 2, true);
    doc.setTextColor(0, 0, 0); // Preto
    yPos += 8;

    // Rodapé
    doc.setFontSize(tamanhoFonteNormal);
    doc.setFont('helvetica', 'bold');
    addCenteredText('** CANCELAMENTO DE VENDA **', tamanhoFonteNormal, true);
    yPos += 5;
    doc.setFontSize(tamanhoFontePequena);
    doc.setFont('helvetica', 'normal');
    addCenteredText('Documento emitido por meios eletrônicos em', tamanhoFontePequena);
    yPos += 3;
    addCenteredText(new Date().toLocaleString('pt-BR'), tamanhoFontePequena);
    yPos += 6;
    addCenteredText('Sistema de Gestão Comercial - MariaPass', tamanhoFonteMinima);

    if (imprimir) {
      // Abre o diálogo de impressão do navegador
      doc.autoPrint();
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      // Foca na janela para garantir que o diálogo de impressão apareça
      if (printWindow) {
        printWindow.focus();
      }
    } else {
      // Baixa o PDF
      doc.save(`comprovante-cancelamento-${data.numero_pedido || 'sem-numero'}.pdf`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <DialogTitle>Comprovante de Cancelamento</DialogTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setShowConfig(!showConfig)}
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {showConfig && (
            <div className="rounded-lg border p-4 mt-2">
              <DialogDescription className="mb-3 font-medium">
                Configurações de Impressão
              </DialogDescription>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Tamanho do Papel</Label>
                  <RadioGroup 
                    value={tamanhoPapel} 
                    onValueChange={(value: '58mm' | '80mm') => setTamanhoPapel(value)}
                    className="mt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="58mm" id="option-58mm" />
                      <Label htmlFor="option-58mm" className="text-sm font-normal">58mm (Bobina Pequena)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="80mm" id="option-80mm" defaultChecked />
                      <Label htmlFor="option-80mm" className="text-sm font-normal">80mm (Bobina Grande)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Cabeçalho */}
          <div className="text-center">
            <h3 className="text-lg font-bold">{comprovanteData.estabelecimento}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {comprovanteData.endereco_estabelecimento}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              CNPJ: {comprovanteData.cnpj_estabelecimento}
            </p>
          </div>

          <div className="border-t border-b py-2 text-center font-bold">
            COMPROVANTE DE CANCELAMENTO
          </div>

          {/* Detalhes */}
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500">DATA/HORA</p>
              <p>{comprovanteData.data_hora}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500">NÚMERO</p>
              <p>{comprovanteData.numero_comprovante}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500">OPERADOR</p>
              <p>{comprovanteData.operador}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500">FORMA DE PAGAMENTO</p>
              <p>{comprovanteData.forma_pagamento}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500">CÓDIGO DE AUTORIZAÇÃO</p>
              <p>{comprovanteData.codigo_autorizacao}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500">MOTIVO</p>
              <p>{comprovanteData.motivo}</p>
            </div>
          </div>

          {/* Valor */}
          <div className="mt-6 text-center">
            <p className="text-sm font-semibold text-gray-500">VALOR CANCELADO</p>
            <p className="text-2xl font-bold text-emerald-600">{comprovanteData.valor}</p>
          </div>

          {/* Rodapé */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p className="font-bold">** CANCELAMENTO DE VENDA **</p>
            <p>Documento emitido por meios eletrônicos em</p>
            <p>{new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => gerarPDF(false)}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button 
              type="button" 
              onClick={() => gerarPDF(true)}
              className="gap-1"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
