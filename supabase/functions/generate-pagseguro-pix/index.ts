
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
    const { valor, recargaId, description } = await req.json()
    
    // Buscar credenciais das variáveis de ambiente
    const pagseguroEmail = Deno.env.get('PAGSEGURO_EMAIL')
    const pagseguroToken = Deno.env.get('PAGSEGURO_TOKEN')
    const isSandbox = Deno.env.get('PAGSEGURO_SANDBOX') === 'true'
    
    console.log('🔑 Usando credenciais PagSeguro - Email:', pagseguroEmail, 'Sandbox:', isSandbox)
    
    if (!pagseguroEmail || !pagseguroToken) {
      throw new Error('Credenciais PagSeguro não configuradas nas Edge Functions')
    }
    
    const baseUrl = isSandbox 
      ? 'https://ws.sandbox.pagseguro.uol.com.br'
      : 'https://ws.pagseguro.uol.com.br'
    
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)
    
    // Payload para PagSeguro PIX
    const pixPayload = {
      reference_id: `recarga_${recargaId}`,
      description: description,
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
      ]
    }
    
    console.log('📤 Enviando request para PagSeguro:', JSON.stringify(pixPayload, null, 2))
    
    // Chamar API do PagSeguro
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pagseguroToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(pixPayload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro PagSeguro:', response.status, errorText)
      throw new Error(`Erro PagSeguro: ${response.status} - ${errorText}`)
    }
    
    const pagseguroResponse = await response.json()
    console.log('✅ Resposta PagSeguro:', JSON.stringify(pagseguroResponse, null, 2))
    
    // Extrair dados do PIX
    const qrCode = pagseguroResponse.qr_codes?.[0]?.text
    const qrImage = pagseguroResponse.qr_codes?.[0]?.links?.[0]?.href
    
    if (!qrCode) {
      throw new Error('QR Code não encontrado na resposta do PagSeguro')
    }
    
    return new Response(
      JSON.stringify({
        pagseguro_id: pagseguroResponse.id,
        qr_code: qrCode,
        qr_image: qrImage || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`,
        expires_at: expiresAt.toISOString(),
        status: 'waiting'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
