# Test webhook after CORS fix
# This should now work without 401 errors

$webhookUrl = "https://nlwsaaffxzdaxiojyjse.supabase.co/functions/v1/stripe-webhook"

Write-Host "Testing webhook after CORS fix..."
Write-Host "Webhook URL: $webhookUrl"
Write-Host ""

# Test with a simple POST request
try {
    Write-Host "Testing POST request..."
    $response = Invoke-WebRequest -Uri $webhookUrl -Method Post -ContentType "application/json" -Body '{"test": "data"}'
    Write-Host "POST Response Status: $($response.StatusCode)"
    Write-Host "POST Response: $($response.Content)"
} catch {
    Write-Host "POST Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)"
        Write-Host "Response Content: $($_.Exception.Response.Content)"
    }
}
