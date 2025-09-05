# Deploy the fixed webhook function
# This will update the webhook with CORS headers

Write-Host "Deploying fixed webhook function..."

# Check if supabase CLI is available
try {
    $supabaseVersion = npx supabase --version
    Write-Host "Supabase CLI version: $supabaseVersion"
} catch {
    Write-Host "Error: Supabase CLI not found. Please install it first."
    Write-Host "Visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
}

# Deploy the webhook function
try {
    Write-Host "Deploying stripe-webhook function..."
    npx supabase functions deploy stripe-webhook
    Write-Host "✅ Webhook function deployed successfully!"
} catch {
    Write-Host "❌ Error deploying webhook function: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test the webhook: .\test-webhook-after-fix.ps1"
Write-Host "2. Make a test payment to see if orders are created"
Write-Host "3. Check Supabase logs for webhook activity"
