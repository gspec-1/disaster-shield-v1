// Payment Configuration
// This file centralizes all payment-related logic and product definitions

export interface PaymentGroup {
  name: string
  description: string
  products: string[]
  required: boolean
}

export const PAYMENT_GROUPS: Record<string, PaymentGroup> = {
  // Core project payments (required for project completion)
  CORE_PROJECT: {
    name: 'Core Project Payments',
    description: 'Required payments to complete the project',
    products: ['SECURITY_DEPOSIT', 'DISASTERSHIELD_SERVICE_FEE', 'REPAIR_COST_ESTIMATE'],
    required: true
  },
  
  // FNOL payments (optional, per-FNOL basis)
  FNOL_GENERATION: {
    name: 'FNOL Generation',
    description: 'Payment for generating First Notice of Loss documents',
    products: ['FNOL_GENERATION_FEE'],
    required: false
  }
}

// Helper function to get all required products
export function getRequiredProducts(): string[] {
  return Object.values(PAYMENT_GROUPS)
    .filter(group => group.required)
    .flatMap(group => group.products)
}

// Helper function to get all products for a specific group
export function getProductsForGroup(groupKey: string): string[] {
  return PAYMENT_GROUPS[groupKey]?.products || []
}

// Helper function to check if all required payments are completed
export function areAllRequiredPaymentsCompleted(completedOrders: any[]): boolean {
  const requiredProducts = getRequiredProducts()
  const completedProductIds = completedOrders.map(order => order.product_id)
  
  return requiredProducts.every(productKey => 
    completedProductIds.includes(productKey)
  )
}

// Helper function to check if payments for a specific group are completed
export function areGroupPaymentsCompleted(groupKey: string, completedOrders: any[]): boolean {
  const groupProducts = getProductsForGroup(groupKey)
  const completedProductIds = completedOrders.map(order => order.product_id)
  
  return groupProducts.every(productKey => 
    completedProductIds.includes(productKey)
  )
}

// Helper function to check if a specific payment is completed
export function isPaymentCompleted(productKey: string, completedOrders: any[]): boolean {
  return completedOrders.some(order => order.product_id === productKey)
}

// Helper function to get payment status for a group
export function getGroupPaymentStatus(groupKey: string, completedOrders: any[]): {
  completed: boolean
  total: number
  paid: number
  products: Array<{
    productKey: string
    completed: boolean
  }>
} {
  const groupProducts = getProductsForGroup(groupKey)
  const completedProductIds = completedOrders.map(order => order.product_id)
  
  const products = groupProducts.map(productKey => ({
    productKey,
    completed: completedProductIds.includes(productKey)
  }))
  
  const paid = products.filter(p => p.completed).length
  const total = products.length
  const completed = paid === total
  
  return {
    completed,
    total,
    paid,
    products
  }
}

// Helper function to get overall payment status
export function getOverallPaymentStatus(completedOrders: any[]): {
  coreProject: ReturnType<typeof getGroupPaymentStatus>
  fnolGeneration: ReturnType<typeof getGroupPaymentStatus>
  allRequiredCompleted: boolean
} {
  return {
    coreProject: getGroupPaymentStatus('CORE_PROJECT', completedOrders),
    fnolGeneration: getGroupPaymentStatus('FNOL_GENERATION', completedOrders),
    allRequiredCompleted: areAllRequiredPaymentsCompleted(completedOrders)
  }
}
