
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pagseguro_id, transaction_id } = await req.json()
    
    // Buscar credenciais das variáveis de ambiente
    const pagseguroEmail = Deno.env.get('PAGSEGURO_EMAIL')
    const pagseguroToken = Deno.env.get('PAGSEGURO_TOKEN')
    const isSandbox = Deno.env.get('PAGSEGURO_SANDBOX') === 'true'
    
    if (!pagseguroEmail || !pagseguroToken) {
      throw new Error('Credenciais PagSeguro não configuradas')
    }
    
    const baseUrl = isSandbox 
      ? 'https://ws.sandbox.pagseguro.uol.com.br'
      : 'https://ws.pagseguro.uol.com.br'
    
    console.log('🔍 Verificando pagamento PagSeguro:', pagseguro_id)
    
    // Consultar status do pagamento na API do PagSeguro
    const response = await fetch(`${baseUrl}/orders/${pagseguro_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pagseguroToken}`,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro ao consultar PagSeguro:', response.status, errorText)
      throw new Error(`Erro PagSeguro: ${response.status}`)
    }
    
    const orderData = await response.json()
    console.log('📊 Status PagSeguro:', orderData.status)
    
    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    let status = 'waiting'
    
    if (orderData.status === 'PAID') {
      status = 'paid'
      
      // Atualizar status no banco local
      await supabaseClient
        .from('transacoes_pix')
        .update({ 
          status: 'pago',
          pago_em: new Date().toISOString()
        })
        .eq('id', transaction_id)
      
      console.log('✅ Pagamento confirmado e atualizado no banco')
    }
    
    return new Response(
      JSON.stringify({
        status: status,
        pagseguro_status: orderData.status,
        updated: status === 'paid'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Erro ao verificar pagamento:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
