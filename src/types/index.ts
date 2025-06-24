// Tipos compartilhados para o projeto PDV MariaPass 2025

// Tipos base para produtos
export interface BaseProduct {
  id: string;
  nome: string;
  preco: number;
  codigo_barras: string | null;
  categoria: string;
  estoque: number;
  status: string;
  imagem_url?: string | null;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

// Interface para produtos no contexto do totem
export interface TotemProduct extends BaseProduct {}

// Interface para itens no carrinho
export interface TotemCartItem extends BaseProduct {
  quantity: number;
}

// Interface para produtos escaneados pelo leitor de código de barras
export interface BarcodeScannedProduct {
  id: string;
  name: string;
  price: number;
  barcode: string;
  category?: string;
  stock?: number;
  image_url?: string;
}

// Tipos para o componente de leitura de código de barras
export interface BarcodeReaderProps {
  onScan: (barcode: string) => void;
  onError?: (error: Error) => void;
  onScanComplete?: () => void;
  minLength?: number;
  timeBeforeScan?: number;
  onKeyDetect?: (event: KeyboardEvent) => void;
}

// Tipos para o modal de código de barras
export interface BarcodeModalProps {
  open: boolean;
  onClose: () => void;
  onProductScanned?: (product: TotemProduct) => void;
  onAddToCart?: (product: TotemProduct) => void;
  onRemoveFromCart?: (productId: string) => void;
  cartItems?: TotemCartItem[];
}

// Tipos para o modal de detalhes do produto
export interface ProductDetailsModalProps {
  product: TotemProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: TotemProduct) => void;
  onRemoveFromCart?: (productId: string) => void;
  cartItems?: { id: string; quantity: number }[];
}
