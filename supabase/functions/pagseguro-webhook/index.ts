
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
    const webhookData = await req.json()
    
    console.log('🔔 Webhook PagSeguro recebido:', JSON.stringify(webhookData, null, 2))
    
    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Extrair informações do webhook
    const orderId = webhookData.id
    const status = webhookData.status
    const referenceId = webhookData.reference_id
    
    if (status === 'PAID') {
      console.log('💰 Pagamento confirmado via webhook para pedido:', orderId)
      
      // Atualizar transação no banco
      const { error } = await supabaseClient
        .from('transacoes_pix')
        .update({ 
          status: 'pago',
          pago_em: new Date().toISOString()
        })
        .eq('recarga_id', referenceId.replace('recarga_', ''))
      
      if (error) {
        console.error('❌ Erro ao atualizar transação:', error)
      } else {
        console.log('✅ Transação atualizada com sucesso')
      }
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Erro no webhook PagSeguro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
