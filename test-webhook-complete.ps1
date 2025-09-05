# Complete webhook test after deployment
# This will test both basic connectivity and webhook processing

$webhookUrl = "https://nlwsaaffxzdaxiojyjse.supabase.co/functions/v1/stripe-webhook"

Write-Host "Testing webhook after complete deployment..."
Write-Host "Webhook URL: $webhookUrl"
Write-Host ""

# Test 1: Basic connectivity
Write-Host "=== Test 1: Basic Connectivity ==="
try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method Post -ContentType "application/json" -Body '{"test": "data"}'
    Write-Host "✅ POST Response Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "❌ POST Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Content: $responseBody"
    }
}

Write-Host ""

# Test 2: OPTIONS request (CORS preflight)
Write-Host "=== Test 2: CORS Preflight ==="
try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method Options
    Write-Host "✅ OPTIONS Response Status: $($response.StatusCode)"
    Write-Host "CORS Headers:"
    $response.Headers | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)"
    }
} catch {
    Write-Host "❌ OPTIONS Error: $($_.Exception.Message)"
}

Write-Host ""

# Test 3: Simulate Stripe webhook
Write-Host "=== Test 3: Simulate Stripe Webhook ==="
$stripePayload = @{
    type = "checkout.session.completed"
    id = "evt_test_webhook"
    api_version = "2020-08-27"
    request = @{
        id = "req_test_manual"
        idempotency_key = $null
    }
    livemode = $false
    pending_webhooks = 1
    object = "event"
    created = 1757082353
    data = @{
        object = @{
            payment_intent = "pi_test_manual_payment_intent"
            metadata = @{
                product_id = "SECURITY_DEPOSIT"
                project_id = "15359147-fd54-44a8-a742-0e79f8a66b3c"
                user_id = "c6ad13ba-e01a-4929-8497-75a4d679220e"
            }
            id = "cs_test_manual_webhook_test"
            currency = "usd"
            status = "complete"
            amount_subtotal = 50000
            customer = "cus_test_manual_customer"
            payment_status = "paid"
            object = "checkout.session"
            amount_total = 50000
            mode = "payment"
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method Post -ContentType "application/json" -Body $stripePayload
    Write-Host "✅ Stripe Webhook Response Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "❌ Stripe Webhook Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Content: $responseBody"
    }
}

Write-Host ""
Write-Host "=== Test Summary ==="
Write-Host "If all tests show 200/204 status codes, the webhook is working correctly."
Write-Host "If you see 401 errors, the deployment may not have worked properly."
