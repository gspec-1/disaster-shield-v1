#!/bin/bash

# Manual webhook test using curl
# This simulates a Stripe checkout.session.completed webhook call

WEBHOOK_URL="https://nlwsaaffxzdaxiojyjse.supabase.co/functions/v1/stripe-webhook"
WEBHOOK_SECRET="whsec_SviQ8U7rBMJLitISMXu5VRZFkEQEE2zp"

# Sample webhook payload
PAYLOAD='{
  "id": "evt_test_webhook",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1757015000,
  "data": {
    "object": {
      "id": "cs_test_manual_webhook_test",
      "object": "checkout.session",
      "amount_subtotal": 50000,
      "amount_total": 50000,
      "currency": "usd",
      "customer": "cus_test_manual_customer",
      "mode": "payment",
      "payment_intent": "pi_test_manual_payment_intent",
      "payment_status": "paid",
      "status": "complete",
      "metadata": {
        "project_id": "15359147-fd54-44a8-a742-0e79f8a66b3c",
        "user_id": "c6ad13ba-e01a-4929-8497-75a4d679220e",
        "product_id": "SECURITY_DEPOSIT"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_manual",
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
}'

# Create timestamp and signature
TIMESTAMP=$(date +%s)
SIGNED_PAYLOAD="${TIMESTAMP}.${PAYLOAD}"
SIGNATURE=$(echo -n "$SIGNED_PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary | base64)
STRIPE_SIGNATURE="t=${TIMESTAMP},v1=${SIGNATURE}"

echo "Testing webhook manually..."
echo "Webhook URL: $WEBHOOK_URL"
echo "Payload: $PAYLOAD"
echo "Signature: $STRIPE_SIGNATURE"
echo ""

# Make the request
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: $STRIPE_SIGNATURE" \
  -d "$PAYLOAD" \
  -v
