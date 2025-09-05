# Manual webhook test using PowerShell
# This simulates a Stripe checkout.session.completed webhook call

$webhookUrl = "https://nlwsaaffxzdaxiojyjse.supabase.co/functions/v1/stripe-webhook"
$webhookSecret = "whsec_SviQ8U7rBMJLitISMXu5VRZFkEQEE2zp"

# Sample webhook payload
$payload = @{
    id = "evt_test_webhook"
    object = "event"
    api_version = "2020-08-27"
    created = [int][double]::Parse((Get-Date -UFormat %s))
    data = @{
        object = @{
            id = "cs_test_manual_webhook_test"
            object = "checkout.session"
            amount_subtotal = 50000
            amount_total = 50000
            currency = "usd"
            customer = "cus_test_manual_customer"
            mode = "payment"
            payment_intent = "pi_test_manual_payment_intent"
            payment_status = "paid"
            status = "complete"
            metadata = @{
                project_id = "15359147-fd54-44a8-a742-0e79f8a66b3c"
                user_id = "c6ad13ba-e01a-4929-8497-75a4d679220e"
                product_id = "SECURITY_DEPOSIT"
            }
        }
    }
    livemode = $false
    pending_webhooks = 1
    request = @{
        id = "req_test_manual"
        idempotency_key = $null
    }
    type = "checkout.session.completed"
} | ConvertTo-Json -Depth 10

# Create timestamp and signature
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$signedPayload = "${timestamp}.${payload}"

# Create HMAC signature
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($webhookSecret)
$signature = [Convert]::ToBase64String($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($signedPayload)))
$stripeSignature = "t=${timestamp},v1=${signature}"

Write-Host "Testing webhook manually..."
Write-Host "Webhook URL: $webhookUrl"
Write-Host "Payload: $payload"
Write-Host "Signature: $stripeSignature"
Write-Host ""

# Make the request
try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $payload -ContentType "application/json" -Headers @{
        "stripe-signature" = $stripeSignature
    }
    Write-Host "Response: $response"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
