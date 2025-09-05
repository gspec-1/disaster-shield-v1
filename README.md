# DisasterShield - Core-1

A digital-first disaster recovery platform that connects homeowners with qualified contractors instantly.

## Overview

DisasterShield streamlines the insurance claim process by:
- Providing a mobile-friendly intake form for quick claim filing
- Automatically generating professional claim packets
- Matching homeowners with qualified local contractors
- Facilitating secure payments and project tracking

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Payments**: Stripe Checkout
- **Email**: Resend
- **PDF Generation**: @react-pdf/renderer
- **Deployment**: Vercel

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the SQL migration in `/supabase/migrations/create_core_schema.sql`
3. Create storage buckets:
   - `project-media` (private)
   - `claim-packets` (private)
4. Update `.env.local` with your Supabase credentials

### 3. Base URL Configuration

The application uses the `VITE_APP_URL` environment variable to generate URLs for emails and redirects. Make sure to set this variable according to your deployment environment:

```bash
# For local development
VITE_APP_URL=http://localhost:5173

# For production
VITE_APP_URL=https://disaster-shield-v2.vercel.app
```

You can also use the provided script to update this value automatically:

```bash
# For local development
node scripts/update-env-url.js local

# For production
node scripts/update-env-url.js production
```

### 4. Email Configuration

The application uses Resend for sending emails through Supabase Edge Functions. By default, emails are mocked in development to avoid using up your Resend quota.

#### Deploy the Email Edge Function

```bash
# Deploy the email function to Supabase
npm run deploy:email-function

# Configure email secrets (API key, sender, and disable mock mode)
npm run set:email-secrets
```

#### Toggle between mock and real emails

```bash
# Enable mock mode (emails will be simulated but not actually sent)
npm run set:email-mock

# Disable mock mode (real emails will be sent using Resend)
npm run set:email-real
```

The email Edge Function logs all email attempts in the console, whether they're mocked or actually sent.

### 3. Stripe Setup

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Set up a webhook endpoint pointing to `/api/payments/webhook`
4. Update `.env.local` with your Stripe credentials

### 4. Email Setup (Resend)

1. Create a Resend account
2. Verify your domain
3. Get your API key and update `.env.local`

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

## Database Schema

The core schema includes:

- **profiles**: User accounts with role-based access
- **contractors**: Business information and service capabilities  
- **projects**: Insurance claims and project tracking
- **media**: Photo/video documentation storage
- **match_requests**: Contractor job invitations
- **payments**: Transaction records

## Storage Buckets

- **project-media**: Private bucket for damage photos and videos
- **claim-packets**: Private bucket for generated PDF documents

## Seed Data

Sample contractors can be loaded via CSV or through the admin interface. Example format:

```csv
company_name,contact_name,email,phone,service_areas,trades,capacity,calendly_url
Gulf Rapid Restore,James Miller,james@gulfrapid.com,+19415551212,"[""Sarasota"",""Charlotte""]","[""water_mitigation""]",active,https://calendly.com/gulfrapid/inspection
```

## Workflow

1. **Homeowner Intake**: 5-step wizard collecting damage details and media
2. **Packet Generation**: Automated PDF creation with photos and claim details
3. **Contractor Matching**: Algorithm scores contractors by location, trade fit, and availability
4. **Email Invitations**: Secure token-based accept/decline links sent to top contractors
5. **Job Assignment**: First contractor to accept gets the job, others are notified
6. **Payment Processing**: Stripe Checkout for security deposits
7. **Project Tracking**: Real-time status updates and communication tools

## Testing

Run the smoke test flow:
1. Complete intake form at `/intake`
2. Check packet generation works
3. Verify contractor matching emails
4. Test accept/decline flows
5. Confirm payment processing

## Key Features

- Mobile-responsive design optimized for emergency situations
- Role-based authentication (homeowner, contractor, admin)
- Real-time project status tracking
- Secure file upload and storage
- Automated contractor matching algorithm
- Professional PDF packet generation
- Stripe payment integration
- Email notification system

## Security

- Row Level Security (RLS) on all database tables
- Private storage buckets with signed URLs
- HMAC-based tokens for contractor acceptance
- Stripe webhook signature verification
- Input validation with Zod schemas

## Development

The application follows Next.js 14 App Router conventions:
- Server and Client components properly separated
- API routes for backend functionality
- Responsive design with Tailwind CSS
- Type-safe database operations
- Error boundaries and loading states

## Deployment

Deploy to Vercel with environment variables configured in the project settings. Ensure Stripe webhook URLs are updated to point to your production domain.