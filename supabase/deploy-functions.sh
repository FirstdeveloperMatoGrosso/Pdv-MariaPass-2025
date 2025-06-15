
#!/bin/bash

echo "🚀 Deploying PagSeguro Edge Functions..."

echo "📦 Deploying generate-pagseguro-pix..."
supabase functions deploy generate-pagseguro-pix --project-ref $SUPABASE_PROJECT_REF

echo "📦 Deploying pagseguro-webhook..."
supabase functions deploy pagseguro-webhook --project-ref $SUPABASE_PROJECT_REF

echo "📦 Deploying check-pagseguro-payment..."
supabase functions deploy check-pagseguro-payment --project-ref $SUPABASE_PROJECT_REF

echo "✅ All functions deployed successfully!"

echo ""
echo "🔐 Don't forget to set your environment variables:"
echo "supabase secrets set PAGSEGURO_EMAIL=your_email@example.com"
echo "supabase secrets set PAGSEGURO_TOKEN=your_token"
echo "supabase secrets set PAGSEGURO_SANDBOX=true"
