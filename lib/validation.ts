import { z } from 'zod';

export const IntakeSchema = z.object({
  contact: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().regex(/^\+1[0-9]{10}$/, 'Phone must be in E.164 format (+1XXXXXXXXXX)'),
    email: z.string().email('Valid email required'),
  }),
  address: z.object({
    street: z.string().min(5, 'Street address is required'),
    unit: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().length(2, 'State must be 2 characters'),
    zip: z.string().regex(/^\d{5}$/, 'ZIP must be 5 digits'),
  }),
  incident: z.object({
    peril: z.enum(['flood', 'water', 'wind', 'fire', 'mold', 'other']),
    incidentAt: z.string().min(1, 'Incident date is required'),
    areas: z.string().optional(),
    waterCategory: z.enum(['1', '2', '3']).optional(),
    powerOn: z.boolean().optional(),
    description: z.string().min(20, 'Description must be at least 20 characters').max(500, 'Description must be under 500 characters'),
    sqftImpacted: z.number().min(1).optional(),
  }),
  media: z.object({
    uploads: z.array(z.object({
      storagePath: z.string(),
      type: z.enum(['photo', 'video']),
      roomTag: z.string().optional(),
      caption: z.string().optional(),
    })).min(1, 'At least one photo or video is required'),
    voiceNotePath: z.string().optional(),
  }),
  insurance: z.object({
    willFile: z.enum(['yes', 'no', 'unsure']),
    carrierName: z.string().optional(),
    policyNumber: z.string().optional(),
    deductibleCents: z.number().min(0).optional(),
  }),
  schedule: z.object({
    preferredDateISO: z.string().min(1, 'Preferred date is required'),
    preferredWindow: z.enum(['8-10', '10-12', '12-2', '2-4', '4-6']),
  }),
  consents: z.object({
    shareAndContactOk: z.boolean().refine(val => val === true, 'You must consent to share information'),
    termsAccepted: z.boolean().refine(val => val === true, 'You must accept terms and conditions'),
  }),
});

export const ContractorOnboardingSchema = z.object({
  user_id: z.string().uuid(),
  company_name: z.string().min(2, 'Company name is required'),
  contact_name: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^\+1[0-9]{10}$/, 'Phone must be in E.164 format'),
  service_areas: z.array(z.string()).min(1, 'At least one service area required'),
  trades: z.array(z.string()).min(1, 'At least one trade required'),
  capacity: z.enum(['active', 'paused']).default('active'),
  calendly_url: z.string().url().optional().or(z.literal('')),
});

export type IntakeFormData = z.infer<typeof IntakeSchema>;
export type ContractorOnboardingData = z.infer<typeof ContractorOnboardingSchema>;