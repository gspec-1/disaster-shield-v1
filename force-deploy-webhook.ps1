# Force deploy webhook with complete code
# This will ensure the webhook is properly deployed

Write-Host "Force deploying webhook function..."

# Check if supabase CLI is available
try {
    $supabaseVersion = npx supabase --version
    Write-Host "Supabase CLI version: $supabaseVersion"
} catch {
    Write-Host "Error: Supabase CLI not found. Please install it first."
    Write-Host "Visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
}

# Check current project
Write-Host "Checking current Supabase project..."
try {
    npx supabase status
} catch {
    Write-Host "Error: Not connected to Supabase project. Please run 'npx supabase link' first."
    exit 1
}

# Force deploy the webhook function
Write-Host "Force deploying stripe-webhook function..."
try {
    # Use --no-verify-jwt to bypass authentication issues
    npx supabase functions deploy stripe-webhook --no-verify-jwt
    Write-Host "✅ Webhook function deployed successfully!"
} catch {
    Write-Host "❌ Error deploying webhook function: $($_.Exception.Message)"
    Write-Host "Trying alternative deployment method..."
    
    # Try without --no-verify-jwt flag
    try {
        npx supabase functions deploy stripe-webhook
        Write-Host "✅ Webhook function deployed successfully (alternative method)!"
    } catch {
        Write-Host "❌ Alternative deployment also failed: $($_.Exception.Message)"
        exit 1
    }
}

Write-Host ""
Write-Host "Deployment completed. Next steps:"
Write-Host "1. Test the webhook: .\test-webhook-after-fix.ps1"
Write-Host "2. Check Supabase Dashboard → Edge Functions → stripe-webhook"
Write-Host "3. Make a test payment to verify orders are created"
