# Simple webhook endpoint test
# This just tests if the endpoint is accessible

$webhookUrl = "https://nlwsaaffxzdaxiojyjse.supabase.co/functions/v1/stripe-webhook"

Write-Host "Testing webhook endpoint accessibility..."
Write-Host "Webhook URL: $webhookUrl"
Write-Host ""

# Test with a simple GET request first
try {
    Write-Host "Testing GET request..."
    $response = Invoke-WebRequest -Uri $webhookUrl -Method Get
    Write-Host "GET Response Status: $($response.StatusCode)"
    Write-Host "GET Response: $($response.Content)"
} catch {
    Write-Host "GET Error: $($_.Exception.Message)"
}

Write-Host ""

# Test with a simple POST request
try {
    Write-Host "Testing POST request..."
    $response = Invoke-WebRequest -Uri $webhookUrl -Method Post -ContentType "application/json" -Body '{"test": "data"}'
    Write-Host "POST Response Status: $($response.StatusCode)"
    Write-Host "POST Response: $($response.Content)"
} catch {
    Write-Host "POST Error: $($_.Exception.Message)"
}
