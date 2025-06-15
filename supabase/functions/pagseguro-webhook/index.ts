
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
    const amount = webhookData.amount
    const paymentDate = webhookData.paid_at || new Date().toISOString()
    
    // Metadados do webhook
    const webhookMetadata = {
      webhook_received_at: new Date().toISOString(),
      pagseguro_order_id: orderId,
      pagseguro_status: status,
      pagseguro_reference: referenceId,
      payment_amount: amount,
      payment_date: paymentDate,
      webhook_type: 'payment_notification',
      processed_by: 'pagseguro_webhook_v1'
    }
    
    console.log('📊 Metadados do webhook:', webhookMetadata)
    
    if (status === 'PAID') {
      console.log('💰 Pagamento confirmado via webhook para pedido:', orderId)
      
      // Extrair recarga_id do reference_id
      const recargaId = referenceId?.replace('totem_', '')
      
      if (!recargaId) {
        console.error('❌ Erro: recarga_id não encontrado no reference_id:', referenceId)
        throw new Error('recarga_id não encontrado no webhook')
      }
      
      // Atualizar transação no banco com metadados completos
      const { data: updateData, error } = await supabaseClient
        .from('transacoes_pix')
        .update({ 
          status: 'pago',
          pago_em: paymentDate,
          webhook_metadata: JSON.stringify(webhookMetadata),
          updated_at: new Date().toISOString()
        })
        .eq('recarga_id', recargaId)
        .select()
      
      if (error) {
        console.error('❌ Erro ao atualizar transação:', error)
        throw error
      }
      
      console.log('✅ Transação atualizada com sucesso:', updateData)
      
      // Log adicional para auditoria
      console.log('📋 Resumo do pagamento processado:')
      console.log(`   - Pedido: ${recargaId}`)
      console.log(`   - Valor: R$ ${amount?.value ? (amount.value / 100).toFixed(2) : 'N/A'}`)
      console.log(`   - Data: ${paymentDate}`)
      console.log(`   - PagSeguro ID: ${orderId}`)
      
    } else {
      console.log(`ℹ️ Status do pagamento: ${status} - Não processando ainda`)
    }
    
    return new Response(
      JSON.stringify({ 
        received: true,
        processed_at: new Date().toISOString(),
        status_received: status,
        order_id: orderId,
        metadata: webhookMetadata
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Erro no webhook PagSeguro:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        received_at: new Date().toISOString(),
        error_code: 'WEBHOOK_PROCESSING_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
