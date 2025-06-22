import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Check, X, FileText, Package, Download } from 'lucide-react';
import SimpleQRCode from './SimpleQRCode';
import jsPDF from 'jspdf';

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
  paymentMethod = 'Pulseira',
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

  const handleGeneratePDFFromButton = () => {
    // Criar PDF no formato 58mm (aproximadamente 58x297mm para impressora térmica)
    const doc = new jsPDF({
      unit: 'mm',
      format: [58, 297] // Largura 58mm, altura variável
    });
    
    const currentDate = new Date().toLocaleString('pt-BR');
    const generatedNSU = nsu || `NSU${Date.now().toString().slice(-8)}`;
    
    if (printMode === 'individual') {
      // Gerar PDF com fichas individuais para impressora térmica
      cart.forEach((item, index) => {
        if (index > 0) doc.addPage();
        
        const validationData = generateValidationData(item.id);
        const barcodeNumber = generateBarcode(validationData);
        
        let yPos = 8;
        
        // Cabeçalho centralizado
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('MARIAPASS', 29, yPos, { align: 'center' });
        yPos += 6;
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Ficha Individual de Produto', 29, yPos, { align: 'center' });
        yPos += 8;
        
        // Linha separadora
        doc.setDrawColor(0, 0, 0);
        doc.line(4, yPos, 54, yPos);
        yPos += 6;
        
        // Informações da ficha
        doc.setFontSize(6);
        doc.text(`Ficha: #${orderId}-${index + 1}`, 4, yPos);
        yPos += 4;
        doc.text(`Data: ${currentDate}`, 4, yPos);
        yPos += 4;
        doc.text(`ID: ${item.id}`, 4, yPos);
        yPos += 4;
        doc.text(`Pagto: ${paymentMethod}`, 4, yPos);
        yPos += 4;
        doc.text(`NSU: ${generatedNSU}`, 4, yPos);
        yPos += 6;
        
        // Nome do produto centralizado
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const productName = item.nome.length > 20 ? item.nome.substring(0, 20) + '...' : item.nome;
        doc.text(productName, 29, yPos, { align: 'center' });
        yPos += 6;
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Qtd: ${item.quantity}`, 29, yPos, { align: 'center' });
        yPos += 4;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${(item.preco * item.quantity).toFixed(2)}`, 29, yPos, { align: 'center' });
        yPos += 8;
        
        // QR Code (simulado com hash devido ao tamanho)
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('QR Code:', 29, yPos, { align: 'center' });
        yPos += 4;
        doc.text(`${validationData.hash_validacao}`, 29, yPos, { align: 'center' });
        yPos += 8;
        
        // Código de barras (texto)
        doc.text('Codigo:', 29, yPos, { align: 'center' });
        yPos += 4;
        doc.setFontSize(5);
        doc.text(barcodeNumber, 29, yPos, { align: 'center' });
        yPos += 8;
        
        // Linha separadora
        doc.line(4, yPos, 54, yPos);
        yPos += 4;
        
        // Rodapé
        doc.setFontSize(5);
        doc.text('Obrigado pela preferencia!', 29, yPos, { align: 'center' });
        yPos += 3;
        doc.text('Retire este item no balcao', 29, yPos, { align: 'center' });
        yPos += 3;
        doc.text(`Val: ${validationData.timestamp}`, 29, yPos, { align: 'center' });
      });
    } else {
      // Gerar PDF consolidado para impressora térmica
      const validationData = generateValidationData();
      const barcodeNumber = generateBarcode(validationData);
      
      let yPos = 8;
      
      // Cabeçalho centralizado
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('MARIAPASS', 29, yPos, { align: 'center' });
      yPos += 6;
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Pedidos', 29, yPos, { align: 'center' });
      yPos += 8;
      
      // Linha separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(4, yPos, 54, yPos);
      yPos += 6;
      
      // Informações da ficha
      doc.setFontSize(6);
      doc.text(`Ficha: #${orderId}`, 4, yPos);
      yPos += 4;
      doc.text(`Data: ${currentDate}`, 4, yPos);
      yPos += 4;
      doc.text(`Pagto: ${paymentMethod}`, 4, yPos);
      yPos += 4;
      doc.text(`NSU: ${generatedNSU}`, 4, yPos);
      yPos += 6;
      
      // Lista de produtos
      doc.setFontSize(6);
      cart.forEach(item => {
        const itemName = item.nome.length > 15 ? item.nome.substring(0, 15) + '...' : item.nome;
        doc.text(`${item.quantity}x ${itemName}`, 4, yPos);
        doc.text(`R$ ${(item.preco * item.quantity).toFixed(2)}`, 54, yPos, { align: 'right' });
        yPos += 4;
      });
      
      yPos += 2;
      // Linha separadora
      doc.line(4, yPos, 54, yPos);
      yPos += 4;
      
      // Total
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', 4, yPos);
      doc.text(`R$ ${total.toFixed(2)}`, 54, yPos, { align: 'right' });
      yPos += 8;
      
      // QR Code (simulado com hash devido ao tamanho)
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text('QR Code:', 29, yPos, { align: 'center' });
      yPos += 4;
      doc.text(`${validationData.hash_validacao}`, 29, yPos, { align: 'center' });
      yPos += 8;
      
      // Código de barras (texto)
      doc.text('Codigo:', 29, yPos, { align: 'center' });
      yPos += 4;
      doc.setFontSize(5);
      doc.text(barcodeNumber, 29, yPos, { align: 'center' });
      yPos += 8;
      
      // Linha separadora
      doc.line(4, yPos, 54, yPos);
      yPos += 4;
      
      // Rodapé
      doc.setFontSize(5);
      doc.text('Obrigado pela preferencia!', 29, yPos, { align: 'center' });
      yPos += 3;
      doc.text('Retire seu pedido no balcao', 29, yPos, { align: 'center' });
      yPos += 3;
      doc.text(`Val: ${validationData.timestamp}`, 29, yPos, { align: 'center' });
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
              <div className="flex justify-center items-center space-x-0.5 mb-1">
                {barcodeNumber.split('').map((digit, i) => (
                  <div key={i} className="flex flex-col">
                    <div 
                      className="w-1 bg-black" 
                      style={{ 
                        height: `${20 + (parseInt(digit) % 4) * 2}px`,
                        marginRight: i % 2 === 0 ? '1px' : '0px'
                      }}
                    ></div>
                  </div>
                ))}
              </div>
              <p className="text-xs font-mono font-bold">{barcodeNumber}</p>
            </div>
          </div>
          
          <div className="text-center mt-4 pt-2 border-t border-gray-300">
            <p className="text-xs">Obrigado pela preferência!</p>
            <p className="text-xs">Retire este item no balcão</p>
            <p className="text-xs text-gray-500">Validação: {validationData.timestamp}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderConsolidatedFicha = () => {
    const validationData = generateValidationData();
    const barcodeNumber = generateBarcode(validationData);
    
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-4 rounded-lg font-mono text-sm">
        <div className="text-center space-y-2 border-b border-gray-300 pb-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-xl">
            MP
          </div>
          <h3 className="font-bold text-lg">MARIAPASS</h3>
          <p className="text-xs text-gray-600">Sistema de Pedidos</p>
        </div>
        
        <div className="space-y-1">
          <p><strong>Ficha:</strong> #{orderId}</p>
          <p><strong>Data:</strong> {currentDate}</p>
          <p><strong>Forma Pagamento:</strong> {paymentMethod}</p>
          <p><strong>NSU:</strong> {generateNSU()}</p>
          <hr className="my-2 border-gray-400" />
          
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-xs">
              <span>{item.quantity}x {item.nome} (ID: {item.id})</span>
              <span>R$ {(item.preco * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          <hr className="my-2 border-gray-400" />
          <div className="flex justify-between font-bold">
            <span>TOTAL:</span>
            <span>R$ {total.toFixed(2)}</span>
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
              <div className="flex justify-center items-center space-x-0.5 mb-1">
                {barcodeNumber.split('').map((digit, i) => (
                  <div key={i} className="flex flex-col">
                    <div 
                      className="w-1 bg-black" 
                      style={{ 
                        height: `${20 + (parseInt(digit) % 4) * 2}px`,
                        marginRight: i % 2 === 0 ? '1px' : '0px'
                      }}
                    ></div>
                  </div>
                ))}
              </div>
              <p className="text-xs font-mono font-bold">{barcodeNumber}</p>
            </div>
          </div>
          
          <div className="text-center mt-4 pt-2 border-t border-gray-300">
            <p className="text-xs">Obrigado pela preferência!</p>
            <p className="text-xs">Retire seu pedido no balcão</p>
            <p className="text-xs text-gray-500">Validação: {validationData.timestamp}</p>
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
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Gerar PDF
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
