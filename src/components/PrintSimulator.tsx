import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Check, X, FileText, Package, Download } from 'lucide-react';
import SimpleQRCode from './SimpleQRCode';
import jsPDF from 'jspdf';
import Barcode from 'react-barcode';
import 'jspdf-barcode';

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  quantity: number;
}

interface PrintSimulatorProps {
  orderId: string;
  cart: CartItem[];
  total: number;
  paymentMethod?: string;
  nsu?: string;
  onClose: () => void;
}

const PrintSimulator: React.FC<PrintSimulatorProps> = ({ 
  orderId, 
  cart, 
  total, 
  paymentMethod = 'Produto',
  nsu,
  onClose 
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printComplete, setPrintComplete] = useState(false);
  const [printMode, setPrintMode] = useState<'consolidated' | 'individual' | null>(null);
  const [currentPrintingItem, setCurrentPrintingItem] = useState<number>(0);

  useEffect(() => {
    if (isPrinting && printMode) {
      const totalItems = printMode === 'individual' ? cart.length : 1;
      const timer = setTimeout(() => {
        if (currentPrintingItem < totalItems - 1) {
          setCurrentPrintingItem(prev => prev + 1);
        } else {
          setIsPrinting(false);
          setPrintComplete(true);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPrinting, printMode, currentPrintingItem, cart.length]);

  const handlePrintMode = (mode: 'consolidated' | 'individual') => {
    setPrintMode(mode);
    setIsPrinting(true);
    setCurrentPrintingItem(0);
  };

  // Função para renderizar a ficha consolidada
  const renderConsolidatedFicha = () => {
    const validationData = generateValidationData();
    const barcodeNumber = generateBarcode(validationData);
    
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-blue-600">MARIAPASS</h3>
          <p className="text-xs text-gray-500">Sistema de Pedidos</p>
          <div className="border-t border-gray-200 my-2"></div>
          
          <div className="text-left space-y-1 text-sm">
            <p><span className="font-semibold">Ficha:</span> #{orderId}</p>
            <p><span className="font-semibold">Data:</span> {new Date().toLocaleString('pt-BR')}</p>
            <p><span className="font-semibold">Pagto:</span> {paymentMethod}</p>
            <p><span className="font-semibold">NSU:</span> {nsu || `NSU${Date.now().toString().slice(-8)}`}</p>
          </div>
          
          <div className="border-t border-gray-200 my-3"></div>
          
          <div className="space-y-2 mb-3">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm">{item.quantity}x {item.nome}</span>
                <span className="text-sm font-medium">R$ {(item.preco * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t-2 border-gray-300 my-2"></div>
          
          <div className="flex justify-between font-bold text-lg mb-3">
            <span>TOTAL:</span>
            <span className="text-green-600">R$ {total.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-center my-3">
            <Barcode 
              value={barcodeNumber} 
              format="CODE128" 
              height={40} 
              width={1.5} 
              displayValue={false}
            />
          </div>
          
          <p className="text-xs text-center text-gray-500 mt-1">{barcodeNumber}</p>
          
          <div className="mt-3 text-xs text-center text-gray-600">
            <p>Obrigado pela preferência!</p>
            <p>Validação: {validationData.timestamp}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleGeneratePDFFromButton = () => {
    // Criar PDF no formato 80mm (otimizado para impressora térmica)
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200] // Largura fixa 80mm, altura ajustável
    });
    
    const currentDate = new Date().toLocaleString('pt-BR');
    const generatedNSU = nsu || `NSU${Date.now().toString().slice(-8)}`;
    
    if (printMode === 'individual') {
      // Gerar PDF com fichas individuais seguindo o modelo visual
      cart.forEach((item, index) => {
        // Para cada unidade do item, criar uma ficha
        for (let i = 0; i < item.quantity; i++) {
          if (index > 0 || i > 0) doc.addPage();
          
          const validationData = generateValidationData(item.id);
          const barcodeNumber = generateBarcode(validationData);
          
          let yPos = 5;
          const pageWidth = doc.internal.pageSize.getWidth();
          const margin = 3;
          const contentWidth = pageWidth - (margin * 2);
          
          // Logo/Cabeçalho - Imitando o gradiente azul
          doc.setFillColor(59, 130, 246); // Azul similar ao gradiente
          doc.rect(margin, yPos, contentWidth, 12, 'F');
          
          // Texto "MP" centralizado no cabeçalho
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('MP', pageWidth/2, yPos + 8, { align: 'center' });
          
          yPos += 15;
          
          // Nome da empresa
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('MARIAPASS', pageWidth/2, yPos, { align: 'center' });
          yPos += 5;
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text('Ficha Individual de Produto', pageWidth/2, yPos, { align: 'center' });
          yPos += 8;
          
          // Linha separadora
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;
          
          // Informações da ficha - Layout compacto
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.text(`Ficha: #${orderId}-${index + 1}`, margin, yPos);
          yPos += 3;
          doc.text(`Data: ${currentDate}`, margin, yPos);
          yPos += 3;
          doc.text(`ID: ${item.id}`, margin, yPos);
          yPos += 3;
          doc.text(`Pagto: ${paymentMethod}`, margin, yPos);
          yPos += 3;
          doc.text(`NSU: ${generatedNSU}`, margin, yPos);
          yPos += 6;
          
          // Área do produto - Imitando o card azul
          doc.setFillColor(239, 246, 255); // Azul claro
          doc.setDrawColor(191, 219, 254); // Borda azul
          doc.rect(margin, yPos, contentWidth, 18, 'FD');
          
          // Ícone do produto (simulado com texto)
          doc.setFontSize(8);
          doc.setTextColor(37, 99, 235); // Azul do ícone
          doc.text('📦', pageWidth/2, yPos + 5, { align: 'center' });
          
          // Nome do produto
          yPos += 8;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          const productName = item.nome.length > 18 ? item.nome.substring(0, 18) + '...' : item.nome;
          doc.text(productName, pageWidth/2, yPos, { align: 'center' });
          
          // Quantidade e valor
          yPos += 4;
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          doc.text(`Quantidade: ${item.quantity}`, pageWidth/2, yPos, { align: 'center' });
          
          yPos += 4;
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 197, 94); // Verde
          doc.text(`R$ ${(item.preco * item.quantity).toFixed(2)}`, pageWidth/2, yPos, { align: 'center' });
          
          yPos += 8;
          
          // QR Code área
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('QR Code de Validação:', pageWidth/2, yPos, { align: 'center' });
          yPos += 4;
          
          // Simulação do QR Code com hash
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(0, 0, 0);
          doc.rect(pageWidth/2 - 8, yPos, 16, 16, 'FD');
          
          // Grid simulando QR code
          for(let i = 0; i < 8; i++) {
            for(let j = 0; j < 8; j++) {
              if(Math.random() > 0.5) {
                doc.setFillColor(0, 0, 0);
                doc.rect(pageWidth/2 - 8 + i*2, yPos + j*2, 2, 2, 'F');
              }
            }
          }
          
          yPos += 18;
          doc.setFontSize(5);
          doc.setTextColor(107, 114, 128);
          doc.text(`Hash: ${validationData.hash_validacao}`, pageWidth/2, yPos, { align: 'center' });
          yPos += 6;
          
          // Código de barras
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('Código de Barras EAN-13:', pageWidth/2, yPos, { align: 'center' });
          yPos += 4;
          
          // Adicionar código de barras real usando jspdf-barcode
          const barcodeOptions = {
            fontSize: 10,
            textColor: [0, 0, 0],
            x: pageWidth/2 - 25,
            y: yPos,
            width: 50,
            height: 20,
            displayValue: true,
            font: 'helvetica',
            textMargin: 2,
            margin: 0,
            valid: function(valid: boolean) {
              if (!valid) {
                console.error('Código de barras inválido');
              }
            }
          };
          
          // Usar o código de barras real
          (doc as any).barcode(barcodeNumber, 'CODE128', barcodeOptions);
          yPos += 22;
          
          // Rodapé
          yPos += 2;
          doc.setFontSize(5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text('Obrigado por comprar conosco!', pageWidth/2, yPos, { align: 'center' });
          yPos += 3;
          doc.text('Este comprovante é seu documento fiscal', pageWidth/2, yPos, { align: 'center' });
          yPos += 3;
          doc.text(`Impresso em: ${new Date().toLocaleString('pt-BR')}`, pageWidth/2, yPos, { align: 'center' });
          
          // Adicionar borda ao redor de toda a página
          doc.setDrawColor(200, 200, 200);
          doc.rect(margin, 2, pageWidth - (margin * 2), yPos + 3, 'S');
        }
      });
    } else {
      // Gerar PDF consolidado seguindo o modelo visual
      const validationData = generateValidationData();
      const barcodeNumber = generateBarcode(validationData);
      
      let yPos = 5;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 3;
      const contentWidth = pageWidth - (margin * 2);
      
      // Logo/Cabeçalho - Imitando o gradiente azul
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, yPos, contentWidth, 12, 'F');
      
      // Texto "MP" centralizado no cabeçalho
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MP', pageWidth/2, yPos + 8, { align: 'center' });
      
      yPos += 15;
      
      // Nome da empresa
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('MARIAPASS', pageWidth/2, yPos, { align: 'center' });
      yPos += 5;
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Pedidos', pageWidth/2, yPos, { align: 'center' });
      yPos += 8;
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      
      // Informações da ficha
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ficha: #${orderId}`, margin, yPos);
      yPos += 3;
      doc.text(`Data: ${currentDate}`, margin, yPos);
      yPos += 3;
      doc.text(`Pagto: ${paymentMethod}`, margin, yPos);
      yPos += 3;
      doc.text(`NSU: ${generatedNSU}`, margin, yPos);
      yPos += 6;
      
      // Lista de produtos compacta
      doc.setFontSize(6);
      cart.forEach(item => {
        const itemName = item.nome.length > 15 ? item.nome.substring(0, 15) + '...' : item.nome;
        doc.text(`${item.quantity}x ${itemName}`, margin, yPos);
        doc.text(`R$ ${(item.preco * item.quantity).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 3;
      });
      
      yPos += 2;
      // Linha separadora
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;
      
      // Total
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', margin, yPos);
      doc.setTextColor(34, 197, 94); // Verde
      doc.text(`R$ ${total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;
      
      // QR Code área
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text('QR Code de Validação:', pageWidth/2, yPos, { align: 'center' });
      yPos += 4;
      
      // Simulação do QR Code
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.rect(pageWidth/2 - 8, yPos, 16, 16, 'FD');
      
      // Grid simulando QR code
      for(let i = 0; i < 8; i++) {
        for(let j = 0; j < 8; j++) {
          if(Math.random() > 0.5) {
            doc.setFillColor(0, 0, 0);
            doc.rect(pageWidth/2 - 8 + i*2, yPos + j*2, 2, 2, 'F');
          }
        }
      }
      
      yPos += 18;
      doc.setFontSize(5);
      doc.setTextColor(107, 114, 128);
      doc.text(`Hash: ${validationData.hash_validacao}`, pageWidth/2, yPos, { align: 'center' });
      yPos += 6;
      
      // Código de barras
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Código de Barras EAN-13:', pageWidth/2, yPos, { align: 'center' });
      yPos += 4;
      
      // Gerar código de barras real no formato EAN-13
      const barcodeOptions = {
        bcid: 'code128',  // Tipo de código de barras
        text: barcodeNumber, // Texto a ser codificado
        scale: 2,         // Fator de escala
        height: 10,       // Altura em mm
        includetext: false, // Não incluir texto abaixo do código
        textxalign: 'center', // Alinhamento do texto
        lineWidth: 0.2    // Largura da linha
      };
      
      // Posicionar o código de barras
      (doc as any).barcode(margin, yPos, 'code128', barcodeOptions);
      
      yPos += 10;
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.text(barcodeNumber, pageWidth/2, yPos, { align: 'center' });
      yPos += 6;
      
      // Linha separadora final
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;
      
      // Rodapé
      doc.setFontSize(5);
      doc.setTextColor(107, 114, 128);
      doc.text('Obrigado pela preferência!', pageWidth/2, yPos, { align: 'center' });
      yPos += 3;
      doc.text('Retire seu pedido no balcão', pageWidth/2, yPos, { align: 'center' });
      yPos += 3;
      doc.text(`Validação: ${validationData.timestamp}`, pageWidth/2, yPos, { align: 'center' });
    }
    
    // Salvar o PDF
    const fileName = `ficha-58mm-${orderId}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('PDF da ficha 58mm gerado com sucesso:', fileName);
  };

  const currentDate = new Date().toLocaleString('pt-BR');
  const generateNSU = () => nsu || `NSU${Date.now().toString().slice(-8)}`;
  
  // Gerar dados para QR Code e código de barras com informações reais
  const generateValidationData = (itemId?: string) => {
    const timestamp = Date.now();
    const baseData = {
      empresa: "MARIAPASS",
      pedido: orderId,
      data: new Date().toISOString(),
      timestamp: timestamp,
      valor_total: total,
      forma_pagamento: paymentMethod,
      nsu: generateNSU(),
      hash_validacao: `MP${timestamp.toString().slice(-6)}`
    };
    
    if (itemId) {
      const item = cart.find(i => i.id === itemId);
      return { 
        ...baseData, 
        produto_id: itemId,
        produto_nome: item?.nome,
        produto_valor: item?.preco,
        quantidade: item?.quantity,
        tipo: 'individual'
      };
    }
    
    return {
      ...baseData,
      produtos: cart.map(item => ({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        quantidade: item.quantity
      })),
      tipo: 'consolidado'
    };
  };

  // Gerar código de barras real baseado no padrão EAN-13
  const generateBarcode = (data: any) => {
    const empresaCode = "789"; // Código da empresa
    const timestamp = Date.now().toString();
    const pedidoHash = orderId.replace(/[^0-9]/g, '').slice(-4) || "0000";
    const valorHash = Math.floor(data.valor_total * 100).toString().padStart(4, '0').slice(-4);
    
    // Formar 12 dígitos base
    const baseCode = empresaCode + pedidoHash + valorHash + timestamp.slice(-2);
    
    // Calcular dígito verificador EAN-13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(baseCode[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return baseCode + checkDigit;
  };

  // Gerar dados para QR Code e código de barras com informações reais
  const renderIndividualFicha = (item: CartItem, index: number) => {
    const validationData = generateValidationData(item.id);
    const barcodeNumber = generateBarcode(validationData);
    
    return (
      <div key={item.id} className="bg-gray-50 border-2 border-dashed border-gray-300 p-4 rounded-lg font-mono text-sm mb-4">
        <div className="text-center space-y-2 border-b border-gray-300 pb-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-xl">
            MP
          </div>
          <h3 className="font-bold text-lg">MARIAPASS</h3>
          <p className="text-xs text-gray-600">Ficha Individual de Produto</p>
        </div>
        
        <div className="space-y-1">
          <p><strong>Ficha:</strong> #{orderId}-{index + 1}</p>
          <p><strong>Data:</strong> {currentDate}</p>
          <p><strong>ID Produto:</strong> {item.id}</p>
          <p><strong>Forma Pagamento:</strong> {paymentMethod}</p>
          <p><strong>NSU:</strong> {generateNSU()}</p>
          <hr className="my-2 border-gray-400" />
          
          <div className="text-center py-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-bold text-lg">{item.nome}</p>
              <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
              <p className="font-semibold text-green-600">R$ {(item.preco * item.quantity).toFixed(2)}</p>
            </div>
          </div>
          
          {/* QR Code de Validação */}
          <div className="text-center py-2">
            <p className="text-xs font-bold mb-2">QR Code de Validação:</p>
            <div className="flex justify-center">
              <SimpleQRCode 
                text={JSON.stringify(validationData)}
                size={80}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Hash: {validationData.hash_validacao}</p>
          </div>
          
          {/* Código de Barras */}
          <div className="text-center py-2">
            <p className="text-xs font-bold mb-1">Código de Barras EAN-13:</p>
            <div className="bg-white p-2 border border-gray-300 rounded">
              <div className="flex justify-center">
                <Barcode 
                  value={barcodeNumber} 
                  format="CODE128" 
                  height={40} 
                  width={1.5} 
                  displayValue={false}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Validação: {validationData.timestamp}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!printMode) {
    return (
      <Card className="bg-white shadow-xl border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-green-600" />
              <span>Modo de Impressão</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-center text-gray-600 mb-6">
              Escolha como deseja imprimir as fichas dos produtos:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => handlePrintMode('consolidated')}
                className="h-24 flex flex-col items-center justify-center space-y-2 bg-blue-500 hover:bg-blue-600"
              >
                <FileText className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Ficha Consolidada</div>
                  <div className="text-xs opacity-90">Todos os produtos em uma ficha</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => handlePrintMode('individual')}
                className="h-24 flex flex-col items-center justify-center space-y-2 bg-green-500 hover:bg-green-600"
              >
                <Package className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Fichas Individuais</div>
                  <div className="text-xs opacity-90">Uma ficha para cada produto</div>
                </div>
              </Button>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-600">
              <p><strong>Resumo do pedido:</strong></p>
              <p>• {cart.length} produtos diferentes</p>
              <p>• Total de itens: {cart.reduce((acc, item) => acc + item.quantity, 0)}</p>
              <p>• Valor total: R$ {total.toFixed(2)}</p>
              <p>• Forma de pagamento: {paymentMethod}</p>
              {nsu && <p>• NSU: {nsu}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-xl border-2 border-green-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-green-600" />
            <span>Impressão das Fichas</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isPrinting ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Printer className="w-8 h-8 animate-pulse text-green-600" />
              <span className="text-lg">
                {printMode === 'individual' 
                  ? `Imprimindo ficha ${currentPrintingItem + 1} de ${cart.length}...`
                  : 'Imprimindo ficha consolidada...'
                }
              </span>
            </div>
            
            {printMode === 'individual' && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold text-blue-800">
                  {cart[currentPrintingItem]?.nome}
                </p>
                <p className="text-sm text-blue-600">
                  Quantidade: {cart[currentPrintingItem]?.quantity}
                </p>
              </div>
            )}
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: printMode === 'individual' 
                    ? `${((currentPrintingItem + 1) / cart.length) * 100}%`
                    : '66%'
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {printComplete && (
              <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                <Check className="w-6 h-6" />
                <span className="font-semibold">
                  {printMode === 'individual' 
                    ? `${cart.length} fichas impressas com sucesso!`
                    : 'Ficha consolidada impressa com sucesso!'
                  }
                </span>
              </div>
            )}
            
            <div className="max-h-96 overflow-y-auto space-y-4">
              {printMode === 'individual' 
                ? cart.map((item, index) => renderIndividualFicha(item, index))
                : renderConsolidatedFicha()
              }
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGeneratePDFFromButton}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Fichas
              </Button>
              
              <Button 
                onClick={onClose} 
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                Novo Pedido
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrintSimulator;
