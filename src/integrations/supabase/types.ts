export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cancelamentos: {
        Row: {
          aprovado: boolean | null
          created_at: string
          data_cancelamento: string
          id: string
          motivo: string
          observacoes: string | null
          pedido_id: string | null
          responsavel: string
          valor_cancelado: number
        }
        Insert: {
          aprovado?: boolean | null
          created_at?: string
          data_cancelamento?: string
          id?: string
          motivo: string
          observacoes?: string | null
          pedido_id?: string | null
          responsavel: string
          valor_cancelado: number
        }
        Update: {
          aprovado?: boolean | null
          created_at?: string
          data_cancelamento?: string
          id?: string
          motivo?: string
          observacoes?: string | null
          pedido_id?: string | null
          responsavel?: string
          valor_cancelado?: number
        }
        Relationships: [
          {
            foreignKeyName: "cancelamentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          categoria: string
          chave: string
          created_at: string
          descricao: string | null
          id: string
          updated_at: string
          valor: Json
        }
        Insert: {
          categoria: string
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor: Json
        }
        Update: {
          categoria?: string
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      controle_acesso: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          id: string
          ip_address: string | null
          recurso: string
          sucesso: boolean
          user_agent: string | null
          usuario: string
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          recurso: string
          sucesso?: boolean
          user_agent?: string | null
          usuario: string
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          recurso?: string
          sucesso?: boolean
          user_agent?: string | null
          usuario?: string
        }
        Relationships: []
      }
      impressoes: {
        Row: {
          copias: number | null
          created_at: string
          data_impressao: string
          id: string
          impressora: string
          paginas: number | null
          pedido_id: string | null
          status: string
          tipo: string
          usuario: string
        }
        Insert: {
          copias?: number | null
          created_at?: string
          data_impressao?: string
          id?: string
          impressora: string
          paginas?: number | null
          pedido_id?: string | null
          status?: string
          tipo: string
          usuario: string
        }
        Update: {
          copias?: number | null
          created_at?: string
          data_impressao?: string
          id?: string
          impressora?: string
          paginas?: number | null
          pedido_id?: string | null
          status?: string
          tipo?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "impressoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          created_at: string
          id: string
          pedido_id: string | null
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          pedido_id?: string | null
          preco_unitario: number
          produto_id?: string | null
          quantidade: number
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          pedido_id?: string | null
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          created_at: string
          data_pedido: string
          id: string
          numero_pedido: string
          observacoes: string | null
          status: string
          terminal_id: string | null
          tipo_pagamento: string | null
          updated_at: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_pedido?: string
          id?: string
          numero_pedido: string
          observacoes?: string | null
          status?: string
          terminal_id?: string | null
          tipo_pagamento?: string | null
          updated_at?: string
          valor_total: number
        }
        Update: {
          created_at?: string
          data_pedido?: string
          id?: string
          numero_pedido?: string
          observacoes?: string | null
          status?: string
          terminal_id?: string | null
          tipo_pagamento?: string | null
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminais"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string
          codigo_barras: string | null
          created_at: string
          estoque: number
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          status: string
          updated_at: string
        }
        Insert: {
          categoria: string
          codigo_barras?: string | null
          created_at?: string
          estoque?: number
          id?: string
          imagem_url?: string | null
          nome: string
          preco: number
          status?: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          codigo_barras?: string | null
          created_at?: string
          estoque?: number
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      produtos_mais_vendidos: {
        Row: {
          created_at: string
          id: string
          nome_produto: string
          posicao_ranking: number
          produto_id: string | null
          quantidade_vendida: number
          receita_gerada: number
          relatorio_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome_produto: string
          posicao_ranking: number
          produto_id?: string | null
          quantidade_vendida?: number
          receita_gerada?: number
          relatorio_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome_produto?: string
          posicao_ranking?: number
          produto_id?: string | null
          quantidade_vendida?: number
          receita_gerada?: number
          relatorio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_mais_vendidos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_mais_vendidos_relatorio_id_fkey"
            columns: ["relatorio_id"]
            isOneToOne: false
            referencedRelation: "relatorios_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      pulseiras: {
        Row: {
          cliente_documento: string | null
          cliente_nome: string | null
          codigo: string
          created_at: string
          data_ativacao: string | null
          data_expiracao: string | null
          id: string
          observacoes: string | null
          saldo: number
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cliente_documento?: string | null
          cliente_nome?: string | null
          codigo: string
          created_at?: string
          data_ativacao?: string | null
          data_expiracao?: string | null
          id?: string
          observacoes?: string | null
          saldo?: number
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          cliente_documento?: string | null
          cliente_nome?: string | null
          codigo?: string
          created_at?: string
          data_ativacao?: string | null
          data_expiracao?: string | null
          id?: string
          observacoes?: string | null
          saldo?: number
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      recargas_pulseiras: {
        Row: {
          created_at: string
          id: string
          observacoes: string | null
          pulseira_id: string | null
          responsavel: string
          saldo_anterior: number
          saldo_novo: number
          terminal_id: string | null
          tipo_pagamento: string
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          observacoes?: string | null
          pulseira_id?: string | null
          responsavel: string
          saldo_anterior: number
          saldo_novo: number
          terminal_id?: string | null
          tipo_pagamento: string
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          observacoes?: string | null
          pulseira_id?: string | null
          responsavel?: string
          saldo_anterior?: number
          saldo_novo?: number
          terminal_id?: string | null
          tipo_pagamento?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "recargas_pulseiras_pulseira_id_fkey"
            columns: ["pulseira_id"]
            isOneToOne: false
            referencedRelation: "pulseiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recargas_pulseiras_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminais"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_vendas: {
        Row: {
          created_at: string
          crescimento_percentual: number | null
          data_relatorio: string
          faturamento_total: number
          id: string
          pedidos_realizados: number
          periodo: string
          ticket_medio: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          crescimento_percentual?: number | null
          data_relatorio: string
          faturamento_total?: number
          id?: string
          pedidos_realizados?: number
          periodo: string
          ticket_medio?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          crescimento_percentual?: number | null
          data_relatorio?: string
          faturamento_total?: number
          id?: string
          pedidos_realizados?: number
          periodo?: string
          ticket_medio?: number
          updated_at?: string
        }
        Relationships: []
      }
      terminais: {
        Row: {
          created_at: string
          endereco_ip: string
          id: string
          localizacao: string
          nome: string
          status: string
          tempo_atividade: string | null
          ultima_conexao: string | null
          updated_at: string
          vendas_hoje: number | null
          vendas_totais: number | null
          versao: string
        }
        Insert: {
          created_at?: string
          endereco_ip: string
          id?: string
          localizacao: string
          nome: string
          status?: string
          tempo_atividade?: string | null
          ultima_conexao?: string | null
          updated_at?: string
          vendas_hoje?: number | null
          vendas_totais?: number | null
          versao?: string
        }
        Update: {
          created_at?: string
          endereco_ip?: string
          id?: string
          localizacao?: string
          nome?: string
          status?: string
          tempo_atividade?: string | null
          ultima_conexao?: string | null
          updated_at?: string
          vendas_hoje?: number | null
          vendas_totais?: number | null
          versao?: string
        }
        Relationships: []
      }
      transacoes_pix: {
        Row: {
          chave_pix: string
          created_at: string
          expira_em: string
          id: string
          pago_em: string | null
          qr_code: string
          recarga_id: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          chave_pix: string
          created_at?: string
          expira_em: string
          id?: string
          pago_em?: string | null
          qr_code: string
          recarga_id?: string | null
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          chave_pix?: string
          created_at?: string
          expira_em?: string
          id?: string
          pago_em?: string | null
          qr_code?: string
          recarga_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_pix_recarga_id_fkey"
            columns: ["recarga_id"]
            isOneToOne: false
            referencedRelation: "recargas_pulseiras"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_pulseiras: {
        Row: {
          bandeira: string | null
          created_at: string
          data_venda: string
          forma_pagamento: string
          id: string
          nsu: string | null
          numero_autorizacao: string | null
          produto_id: string | null
          pulseira_id: string | null
          quantidade: number
          terminal_id: string | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          bandeira?: string | null
          created_at?: string
          data_venda?: string
          forma_pagamento: string
          id?: string
          nsu?: string | null
          numero_autorizacao?: string | null
          produto_id?: string | null
          pulseira_id?: string | null
          quantidade?: number
          terminal_id?: string | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          bandeira?: string | null
          created_at?: string
          data_venda?: string
          forma_pagamento?: string
          id?: string
          nsu?: string | null
          numero_autorizacao?: string | null
          produto_id?: string | null
          pulseira_id?: string | null
          quantidade?: number
          terminal_id?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_pulseiras_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_pulseiras_pulseira_id_fkey"
            columns: ["pulseira_id"]
            isOneToOne: false
            referencedRelation: "pulseiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_pulseiras_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminais"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          cliente_email: string | null
          cliente_nome: string | null
          codigo: string
          created_at: string
          data_validade: string
          id: string
          limite_uso: number | null
          observacoes: string | null
          porcentagem: number | null
          produto_id: string | null
          status: string
          tipo: string
          updated_at: string
          usos_realizados: number | null
          valor: number | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome?: string | null
          codigo: string
          created_at?: string
          data_validade: string
          id?: string
          limite_uso?: number | null
          observacoes?: string | null
          porcentagem?: number | null
          produto_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
          usos_realizados?: number | null
          valor?: number | null
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string | null
          codigo?: string
          created_at?: string
          data_validade?: string
          id?: string
          limite_uso?: number | null
          observacoes?: string | null
          porcentagem?: number | null
          produto_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          usos_realizados?: number | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_relatorio_vendas: {
        Args: { data_inicio: string; data_fim: string }
        Returns: {
          faturamento_total: number
          pedidos_realizados: number
          ticket_medio: number
        }[]
      }
      obter_produtos_mais_vendidos: {
        Args: { data_inicio: string; data_fim: string; limite?: number }
        Returns: {
          produto_id: string
          nome_produto: string
          quantidade_vendida: number
          receita_gerada: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
