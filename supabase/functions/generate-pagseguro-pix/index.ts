
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
    console.log('🚀 Iniciando geração de PIX PagSeguro...')
    
    const { valor, recargaId, description, customerInfo } = await req.json()
    console.log('📋 Dados recebidos:', { valor, recargaId, description, customerInfo })
    
    // Buscar credenciais das variáveis de ambiente
    const pagseguroEmail = Deno.env.get('PAGSEGURO_EMAIL')
    const pagseguroToken = Deno.env.get('PAGSEGURO_TOKEN')
    const isSandbox = Deno.env.get('PAGSEGURO_SANDBOX') === 'true'
    
    console.log('🔑 Credenciais encontradas:', { 
      email: pagseguroEmail ? 'Configurado ✅' : 'NÃO CONFIGURADO ❌',  
      token: pagseguroToken ? 'Configurado ✅' : 'NÃO CONFIGURADO ❌',
      sandbox: isSandbox 
    })
    
    if (!pagseguroEmail || !pagseguroToken) {
      console.error('❌ ERRO: Credenciais PagSeguro não configuradas!')
      throw new Error('Credenciais PagSeguro não configuradas nas Edge Functions. Verifique PAGSEGURO_EMAIL e PAGSEGURO_TOKEN.')
    }
    
    const baseUrl = isSandbox 
      ? 'https://ws.sandbox.pagseguro.uol.com.br'
      : 'https://ws.pagseguro.uol.com.br'
    
    console.log('🌐 URL Base PagSeguro:', baseUrl)
    
    // Gerar timestamps para metadados
    const currentTime = new Date()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)
    
    // Metadados do pedido
    const orderMetadata = {
      order_id: recargaId,
      created_at: currentTime.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_method: 'PIX_PAGSEGURO',
      totem_id: 'MARIAPASS_TOTEM_01',
      session_id: `SESSION_${Date.now()}`,
      amount: valor,
      currency: 'BRL'
    }
    
    console.log('📊 Metadados do pedido:', orderMetadata)
    
    // Payload para PagSeguro PIX com metadados completos
    const pixPayload = {
      reference_id: `totem_${recargaId}`,
      description: description || `Compra no Totem MariaPass - R$ ${valor.toFixed(2)} - Pedido: ${recargaId}`,
      amount: {
        value: Math.round(valor * 100), // PagSeguro trabalha com centavos
        currency: 'BRL'
      },
      payment_method: {
        type: 'PIX',
        pix: {
          expiration_date: expiresAt.toISOString()
        }
      },
      notification_urls: [
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/pagseguro-webhook`
      ],
      metadata: {
        ...orderMetadata,
        integration: 'LOVABLE_MARIAPASS',
        version: '1.0.0',
        payment_timeout: '15min',
        additional_info: JSON.stringify({
          platform: 'totem',
          location: 'mariapass_store',
          order_items: customerInfo?.items || [],
          customer_session: orderMetadata.session_id
        })
      }
    }
    
    console.log('📤 Enviando request para PagSeguro com metadados:', JSON.stringify(pixPayload, null, 2))
    
    // Chamar API do PagSeguro
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pagseguroToken}`,
        'Accept': 'application/json',
        'User-Agent': 'MariaPass-Totem/1.0.0'
      },
      body: JSON.stringify(pixPayload)
    })
    
    console.log('📡 Status da resposta PagSeguro:', response.status)
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro PagSeguro:', response.status, errorText)
      
      // Tentar parsear erro JSON se possível
      try {
        const errorJson = JSON.parse(errorText)
        console.error('🔍 Detalhes do erro PagSeguro:', JSON.stringify(errorJson, null, 2))
        
        // Erro mais específico baseado no código de resposta
        let errorMessage = `Erro PagSeguro ${response.status}: `
        if (response.status === 401) {
          errorMessage += 'Credenciais inválidas. Verifique PAGSEGURO_TOKEN.'
        } else if (response.status === 400) {
          errorMessage += errorJson.error_messages?.[0]?.description || 'Dados inválidos enviados para PagSeguro.'
        } else if (response.status === 403) {
          errorMessage += 'Acesso negado. Verifique permissões da conta PagSeguro.'
        } else {
          errorMessage += errorJson.message || errorText
        }
        
        throw new Error(errorMessage)
      } catch (parseError) {
        console.error('🔍 Erro em texto puro:', errorText)
        throw new Error(`Erro PagSeguro ${response.status}: ${errorText}`)
      }
    }
    
    const pagseguroResponse = await response.json()
    console.log('✅ Resposta PagSeguro completa:', JSON.stringify(pagseguroResponse, null, 2))
    
    // Extrair dados do PIX
    const qrCode = pagseguroResponse.qr_codes?.[0]?.text
    const qrImage = pagseguroResponse.qr_codes?.[0]?.links?.[0]?.href
    
    if (!qrCode) {
      console.error('❌ QR Code não encontrado na resposta:', pagseguroResponse)
      throw new Error('QR Code não encontrado na resposta do PagSeguro. Verifique a configuração da conta.')
    }
    
    console.log('🎯 PIX gerado com sucesso!')
    console.log('📱 QR Code (primeiros 50 chars):', qrCode.substring(0, 50) + '...')
    console.log('🖼️ QR Image URL:', qrImage)
    console.log('⏰ Expira em:', expiresAt.toISOString())
    
    // Resposta final com todos os metadados
    const finalResponse = {
      pagseguro_id: pagseguroResponse.id,
      qr_code: qrCode,
      qr_image: qrImage || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`,
      expires_at: expiresAt.toISOString(),
      status: 'waiting',
      metadata: {
        ...orderMetadata,
        pagseguro_reference: pagseguroResponse.reference_id,
        created_time: currentTime.getTime(),
        expiry_time: expiresAt.getTime(),
        payment_window_minutes: 15
      },
      order_info: {
        id: recargaId,
        description: description,
        amount: valor,
        currency: 'BRL',
        payment_method: 'PIX_PAGSEGURO'
      }
    }
    
    console.log('📦 Resposta final com metadados:', JSON.stringify(finalResponse, null, 2))
    
    return new Response(
      JSON.stringify(finalResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Erro na Edge Function:', error)
    console.error('📋 Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Verifique os logs da Edge Function para mais detalhes',
        timestamp: new Date().toISOString(),
        error_code: 'EDGE_FUNCTION_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
