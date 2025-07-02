// Tipos básicos
export interface ProdutoBase {
  id: string;
  nome: string;
  codigo_barras: string;
  preco: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ItemPedidoBase {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  nome: string;
  created_at: string;
}

// Tipos para a resposta da API
export interface ItemPedidoAPI extends ItemPedidoBase {
  produtos: ProdutoBase;
}

export interface PedidoAPI {
  id: string;
  numero_pedido: string;
  valor_total: number;
  tipo_pagamento: string;
  status: string;
  observacoes: string;
  created_at: string;
  itens_pedido: ItemPedidoAPI[];
}

// Tipos para o frontend
export interface ItemPedido extends ItemPedidoBase {
  produtos: ProdutoBase;
}

export interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_documento: string;
  valor_total: number;
  tipo_pagamento: string;
  status: string;
  observacoes: string;
  created_at: string;
  itens: ItemPedido[];
}
