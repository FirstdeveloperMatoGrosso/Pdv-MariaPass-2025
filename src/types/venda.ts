export interface VendaPulseira {
  id: string;
  numero_autorizacao: string;
  data_venda: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  forma_pagamento: string;
  produto_id?: string;
  produto_nome?: string;
  produto_imagem?: string;
  nsu?: string;
  bandeira?: string;
  pulseira_id?: string;
  terminal_id?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'pendente' | 'pago' | 'cancelada' | 'estornado';
}

export interface VendaRealizada extends Omit<VendaPulseira, 'created_at' | 'updated_at'> {
  // Campos adicionais específicos da interface VendaRealizada, se houver
}
