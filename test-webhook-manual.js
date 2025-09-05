// Manual webhook test script
// This simulates a Stripe checkout.session.completed webhook call

const crypto = require('crypto');

// Your webhook endpoint
const WEBHOOK_URL = 'https://nlwsaaffxzdaxiojyjse.supabase.co/functions/v1/stripe-webhook';

// Your webhook secret from .env
const WEBHOOK_SECRET = 'whsec_SviQ8U7rBMJLitISMXu5VRZFkEQEE2zp';

// Sample webhook payload (checkout.session.completed event)
const webhookPayload = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_manual_webhook_test',
      object: 'checkout.session',
      amount_subtotal: 50000,
      amount_total: 50000,
      currency: 'usd',
      customer: 'cus_test_manual_customer',
      mode: 'payment',
      payment_intent: 'pi_test_manual_payment_intent',
      payment_status: 'paid',
      status: 'complete',
      metadata: {
        project_id: '15359147-fd54-44a8-a742-0e79f8a66b3c',
        user_id: 'c6ad13ba-e01a-4929-8497-75a4d679220e',
        product_id: 'SECURITY_DEPOSIT'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_manual',
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

// Create the signature
const payload = JSON.stringify(webhookPayload);
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(signedPayload, 'utf8')
  .digest('hex');

const stripeSignature = `t=${timestamp},v1=${signature}`;

console.log('Testing webhook manually...');
console.log('Webhook URL:', WEBHOOK_URL);
console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
console.log('Signature:', stripeSignature);

// Make the request
fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'stripe-signature': stripeSignature
  },
  body: payload
})
.then(response => {
  console.log('Response status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response body:', data);
})
.catch(error => {
  console.error('Error:', error);
});
