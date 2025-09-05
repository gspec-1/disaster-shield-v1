// Stripe Test Products Configuration
// Only using test mode for development and testing
export const STRIPE_PRODUCTS = {
  SECURITY_DEPOSIT: {
    id: 'prod_SzIHDxwI57wzXS',
    priceId: 'price_1S3JgcGYzYF1t9Ad8ePdG8yh', // This should be your TEST mode price ID
    name: 'Security Deposit',
    description: 'Refundable security deposit to begin work',
    mode: 'payment' as const,
    amount: 50000, // $500.00 in cents
  },
  DISASTERSHIELD_SERVICE_FEE: {
    id: 'prod_SzICBjmQuceCDb',
    priceId: 'price_1S3JcEGYzYF1t9AdTLLyfj8o', // This should be your TEST mode price ID
    name: 'DisasterShield Service Fee',
    description: 'Platform matching and claim management service',
    mode: 'payment' as const,
    amount: 9900, // $99.00 in cents
  },
  EMERGENCY_RESPONSE_FEE: {
    id: 'prod_SzI6FIQTBIZVnx',
    priceId: 'price_1S3JWHGYzYF1t9Adajwh5Lfo', // This should be your TEST mode price ID
    name: 'Emergency Response Fee',
    description: 'Priority contractor matching for urgent claims',
    mode: 'payment' as const,
    amount: 14900, // $149.00 in cents
  },
}

console.log('Using Stripe TEST products with price IDs:', Object.values(STRIPE_PRODUCTS).map(p => p.priceId))

export type ProductKey = keyof typeof STRIPE_PRODUCTS
export type StripeProduct = typeof STRIPE_PRODUCTS[ProductKey]

export function getProductByPriceId(priceId: string): StripeProduct | null {
  return Object.values(STRIPE_PRODUCTS).find(product => product.priceId === priceId) || null
}

export function formatPrice(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100)
}