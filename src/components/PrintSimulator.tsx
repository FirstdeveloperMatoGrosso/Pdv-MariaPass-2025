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

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleString('pt-BR');
    const generatedNSU = nsu || `NSU${Date.now().toString().slice(-8)}`;
    
    // Configurações de cores
    const primaryBlue = [31, 41, 55] as [number, number, number];
    const lightGray = [248, 250, 252] as [number, number, number];
    const greenAccent = [16, 185, 129] as [number, number, number];
    
    if (printMode === 'individual') {
      // Gerar PDF com fichas individuais
      cart.forEach((item, index) => {
        if (index > 0) doc.addPage();
        
        const validationData = generateValidationData(item.id);
        
        // Cabeçalho
        doc.setFillColor(...primaryBlue);
        doc.rect(0, 0, 210, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('MARIAPASS', 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Ficha Individual de Produto`, 120, 20);
        
        // Informações da ficha
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        let yPos = 50;
        doc.text(`Ficha: #${orderId}-${index + 1}`, 20, yPos);
        yPos += 8;
        doc.text(`Data: ${currentDate}`, 20, yPos);
        yPos += 8;
        doc.text(`ID Produto: ${item.id}`, 20, yPos);
        yPos += 8;
        doc.text(`Forma Pagamento: ${paymentMethod}`, 20, yPos);
        yPos += 8;
        doc.text(`NSU: ${generatedNSU}`, 20, yPos);
        
        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos + 5, 190, yPos + 5);
        
        yPos += 20;
        
        // Informações do produto
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(item.nome, 20, yPos);
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Quantidade: ${item.quantity}`, 20, yPos);
        yPos += 8;
        
        doc.setTextColor(...greenAccent);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${(item.preco * item.quantity).toFixed(2)}`, 20, yPos);
        
        yPos += 20;
        
        // QR Code (simulado com texto)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('QR Code de Validação:', 20, yPos);
        yPos += 8;
        doc.text(`Hash: ${validationData.hash_validacao}`, 20, yPos);
        
        yPos += 15;
        
        // Código de barras (simulado)
        const barcodeNumber = generateBarcode(validationData);
        doc.text('Código de Barras EAN-13:', 20, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.text(barcodeNumber, 20, yPos);
        
        // Rodapé
        yPos = 250;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Obrigado pela preferência!', 20, yPos);
        doc.text('Retire este item no balcão', 20, yPos + 5);
        doc.text(`Validação: ${validationData.timestamp}`, 20, yPos + 10);
      });
    } else {
      // Gerar PDF consolidado
      const validationData = generateValidationData();
      
      // Cabeçalho
      doc.setFillColor(...primaryBlue);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MARIAPASS', 20, 20);
      
      doc.setFontSize(10);
      doc.text('Sistema de Pedidos', 120, 20);
      
      // Informações da ficha
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 50;
      doc.text(`Ficha: #${orderId}`, 20, yPos);
      yPos += 8;
      doc.text(`Data: ${currentDate}`, 20, yPos);
      yPos += 8;
      doc.text(`Forma Pagamento: ${paymentMethod}`, 20, yPos);
      yPos += 8;
      doc.text(`NSU: ${generatedNSU}`, 20, yPos);
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos + 5, 190, yPos + 5);
      
      yPos += 20;
      
      // Lista de produtos
      doc.setFontSize(10);
      cart.forEach(item => {
        doc.text(`${item.quantity}x ${item.nome} (ID: ${item.id})`, 20, yPos);
        doc.text(`R$ ${(item.preco * item.quantity).toFixed(2)}`, 150, yPos);
        yPos += 6;
      });
      
      // Linha separadora
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 10;
      
      // Total
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', 20, yPos);
      doc.setTextColor(...greenAccent);
      doc.text(`R$ ${total.toFixed(2)}`, 150, yPos);
      
      yPos += 20;
      
      // QR Code (simulado com texto)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('QR Code de Validação:', 20, yPos);
      yPos += 8;
      doc.text(`Hash: ${validationData.hash_validacao}`, 20, yPos);
      
      yPos += 15;
      
      // Código de barras (simulado)
      const barcodeNumber = generateBarcode(validationData);
      doc.text('Código de Barras EAN-13:', 20, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text(barcodeNumber, 20, yPos);
      
      // Rodapé
      yPos = 250;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Obrigado pela preferência!', 20, yPos);
      doc.text('Retire seu pedido no balcão', 20, yPos + 5);
      doc.text(`Validação: ${validationData.timestamp}`, 20, yPos + 10);
    }
    
    // Salvar o PDF
    const fileName = `ficha-${orderId}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('PDF da ficha gerado com sucesso:', fileName);
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
                onClick={handleGeneratePDF}
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
