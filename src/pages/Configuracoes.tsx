
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import ScannerConfig from '../components/ScannerConfig';
import BarcodeScanner from '../components/BarcodeScanner';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

const Configuracoes: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  const handleProductScanned = (product: Product) => {
    console.log('Produto escaneado:', product);
    // Aqui você pode adicionar a lógica para processar o produto escaneado
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-6 h-6 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scanner de Código de Barras</CardTitle>
        </CardHeader>
        <CardContent>
          <BarcodeScanner onProductScanned={handleProductScanned} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;
