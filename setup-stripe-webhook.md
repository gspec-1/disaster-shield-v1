# Stripe Webhook Setup Guide

## 🔧 **Required Setup Steps**

### 1. **Get Your Webhook Secret**

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)

### 2. **Update Environment Variables**

Replace `whsec_your_webhook_secret_here` in your `.env` file with the actual webhook secret from step 1.

### 3. **Deploy the Webhook Function**

Make sure your Supabase Edge Function is deployed with the updated webhook handler.

## 🧪 **Testing the Webhook**

1. **Make a test payment** using Stripe test card: `4242 4242 4242 4242`
2. **Check the webhook logs** in your Stripe dashboard
3. **Verify the payment status** is updated in your database

## 🔍 **What the Webhook Does**

- ✅ **Creates order records** in `stripe_orders` table
- ✅ **Updates project payment status** to 'paid' for the user
- ✅ **Handles both one-time payments and subscriptions**
- ✅ **Verifies webhook signatures** for security

## 🚨 **Important Notes**

- The webhook will update **ALL unpaid projects** for the user to 'paid' status
- Make sure your webhook endpoint is accessible from the internet
- Test with Stripe's webhook testing tool before going live
