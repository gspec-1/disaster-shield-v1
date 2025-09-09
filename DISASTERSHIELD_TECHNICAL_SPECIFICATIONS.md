# 🛡️ DisasterShield - Technical Specifications & Feature Matrix

## 📊 Feature Matrix by User Role

| Feature | Client | Contractor | Admin | Description |
|---------|--------|------------|-------|-------------|
| **Authentication** | ✅ | ✅ | ✅ | Email/password with role-based access |
| **Dashboard** | ✅ | ✅ | ✅ | Role-specific dashboard with relevant data |
| **Project Management** | ✅ | ✅ | ✅ | View and manage assigned projects |
| **Media Upload** | ✅ | ❌ | ✅ | Upload photos and voice notes |
| **Contractor Matching** | ✅ | ❌ | ✅ | Automated contractor selection |
| **Estimate Submission** | ❌ | ✅ | ✅ | Submit detailed cost estimates |
| **Estimate Review** | ✅ | ❌ | ✅ | Review and accept/reject estimates |
| **Payment Processing** | ✅ | ❌ | ✅ | Secure Stripe payment integration |
| **FNOL Generation** | ✅ | ❌ | ✅ | First Notice of Loss document creation |
| **Insurance Integration** | ✅ | ❌ | ✅ | Direct API submission to insurers |
| **Notification System** | ✅ | ✅ | ✅ | Real-time in-app notifications |
| **Email Notifications** | ✅ | ✅ | ✅ | Transactional email system |
| **SMS Notifications** | ✅ | ✅ | ✅ | Twilio SMS integration |
| **User Management** | ❌ | ❌ | ✅ | Manage users and roles |
| **System Analytics** | ❌ | ❌ | ✅ | Business intelligence dashboard |
| **Insurance Company Management** | ❌ | ❌ | ✅ | Manage insurance provider APIs |

---

## 🔧 Technical Architecture Details

### **Frontend Stack**
```typescript
// Core Technologies
React 18.2.0          // UI Framework
TypeScript 5.2.2      // Type Safety
Vite 5.1.4           // Build Tool
Tailwind CSS 3.4.1   // Styling
Radix UI             // Component Library

// Key Libraries
React Router 6.21.3  // Client-side routing
React Hook Form 7.49.3 // Form management
Zod 3.22.4          // Schema validation
Stripe.js           // Payment processing
Supabase JS 2.39.7  // Backend integration
```

### **Backend Stack**
```typescript
// Core Technologies
Supabase             // Backend-as-a-Service
PostgreSQL          // Database
Edge Functions      // Serverless functions
Row Level Security  // Database security

// Integrations
Stripe API          // Payment processing
Resend API          // Email service
Twilio API          // SMS service
Insurance APIs      // FNOL submission
```

### **Database Schema**
```sql
-- Core Tables
auth.users                    -- Supabase authentication
public.profiles              -- User profiles and roles
public.projects              -- Main project/claim records
public.contractors           -- Contractor information
public.media                 -- File attachments
public.stripe_customers      -- Payment customer mapping
public.stripe_orders         -- Payment order records
public.contractor_estimates  -- Dynamic pricing estimates
public.fnol_records          -- FNOL document records
public.insurance_companies   -- Insurance provider data
public.notifications         -- In-app notifications
public.match_requests        -- Contractor matching records
```

---

## 🚀 API Endpoints & Functions

### **Supabase Edge Functions**

#### **Payment Processing**
```typescript
// POST /functions/v1/stripe-checkout
// Creates Stripe checkout sessions
// Parameters: projectId, productKey, userId
// Returns: checkout URL

// POST /functions/v1/stripe-webhook
// Handles Stripe webhook events
// Updates payment status in database
// Sends completion notifications

// POST /functions/v1/create-dynamic-product
// Creates dynamic Stripe products
// Parameters: estimateId, projectId
// Returns: productId, priceId
```

#### **Communication**
```typescript
// POST /functions/v1/send-email
// Sends transactional emails
// Parameters: to, subject, template, data
// Returns: success status

// POST /functions/v1/submit-fnol
// Submits FNOL to insurance companies
// Parameters: fnolData, insuranceCompanyId
// Returns: submission status
```

### **Frontend API Integration**
```typescript
// Authentication
supabase.auth.signUp()
supabase.auth.signIn()
supabase.auth.signOut()
supabase.auth.getUser()

// Database Operations
supabase.from('table').select()
supabase.from('table').insert()
supabase.from('table').update()
supabase.from('table').delete()

// Real-time Subscriptions
supabase.channel('table').on('*', callback)
```

---

## 💳 Payment System Architecture

### **Payment Structure**
```typescript
interface PaymentGroup {
  CORE_PROJECT: {
    products: ['SECURITY_DEPOSIT', 'DISASTERSHIELD_SERVICE_FEE', 'REPAIR_COST_ESTIMATE']
    required: true
  }
  FNOL_GENERATION: {
    products: ['FNOL_GENERATION_FEE']
    required: false
  }
}

// Payment Amounts
SECURITY_DEPOSIT: $500.00      // Refundable
DISASTERSHIELD_SERVICE_FEE: $99.00  // Platform fee
REPAIR_COST_ESTIMATE: Dynamic   // Based on contractor estimate
FNOL_GENERATION_FEE: $100.00   // Per FNOL generation
```

### **Payment Flow**
1. **Estimate Acceptance** → Dynamic Stripe product creation
2. **Checkout Session** → Secure payment processing
3. **Webhook Processing** → Database updates
4. **Status Updates** → Real-time UI updates
5. **Notifications** → Email/SMS alerts

---

## 🔐 Security Implementation

### **Authentication & Authorization**
```typescript
// Role-based access control
interface UserRole {
  client: 'default' | null
  contractor: 'contractor'
  admin: 'admin'
}

// Route protection
<ClientRoute>     // Client-only access
<AdminRoute>      // Admin-only access
<PublicRoute>     // Public access
```

### **Database Security**
```sql
-- Row Level Security policies
CREATE POLICY "Users can view own data" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Contractors can view own estimates" ON contractor_estimates
  FOR SELECT USING (contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  ));
```

### **API Security**
- JWT token validation
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention

---

## 📱 User Interface Components

### **Core UI Components**
```typescript
// Layout Components
<Dashboard>           // Role-specific dashboard
<ProjectPortal>       // Project details view
<PaymentPage>         // Payment processing
<FNOLPage>           // Document generation

// Form Components
<IntakeForm>         // Claim filing form
<EstimateForm>       // Contractor estimate form
<PaymentForm>        // Payment processing form

// Display Components
<StatusTimeline>     // Project progress
<MediaGallery>       // File attachments
<NotificationBell>   // Real-time alerts
```

### **Responsive Design**
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly interfaces
- Progressive Web App features

---

## 🔄 Workflow Automation

### **Contractor Matching Algorithm**
```typescript
interface MatchingCriteria {
  geographicProximity: number    // Distance scoring
  serviceArea: boolean          // Coverage verification
  expertiseMatch: number        // Damage type specialization
  availability: boolean         // Capacity checking
  rating: number               // Performance history
}

// Scoring system
const score = (geographic * 0.4) + (expertise * 0.3) + (rating * 0.3)
```

### **Email Automation**
```typescript
// Email templates
- ContractorInvitation     // Job opportunity emails
- JobAcceptedConfirmation  // Assignment confirmations
- PaymentCompleted         // Payment notifications
- EstimateReceived         // Estimate notifications
- FNOLSubmitted           // Document status updates
```

### **Notification System**
```typescript
// Real-time notifications
interface Notification {
  type: 'job_accepted' | 'payment_completed' | 'estimate_received'
  title: string
  message: string
  data: object
  created_at: timestamp
}
```

---

## 📊 Data Flow & State Management

### **State Management**
```typescript
// React hooks for state
const [user, setUser] = useState<User | null>(null)
const [projects, setProjects] = useState<Project[]>([])
const [notifications, setNotifications] = useState<Notification[]>([])

// Real-time subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
      (payload) => setNotifications(prev => [...prev, payload.new])
    )
    .subscribe()
  
  return () => subscription.unsubscribe()
}, [])
```

### **Data Validation**
```typescript
// Zod schemas
const ProjectSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  peril: z.enum(['water', 'fire', 'wind', 'other']),
  description: z.string().min(10)
})
```

---

## 🚀 Deployment & Infrastructure

### **Frontend Deployment (Vercel)**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "nodeVersion": "18.x"
}
```

### **Backend Deployment (Supabase)**
```bash
# Database migrations
supabase db push

# Edge function deployment
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy send-email
supabase functions deploy create-dynamic-product
```

### **Environment Configuration**
```typescript
// Environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

---

## 📈 Performance & Scalability

### **Performance Optimizations**
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Database query optimization
- Caching strategies
- CDN integration

### **Scalability Considerations**
- Horizontal scaling with Supabase
- Edge function auto-scaling
- Database connection pooling
- File storage optimization
- API rate limiting

---

## 🔍 Monitoring & Analytics

### **Error Tracking**
```typescript
// Error boundary implementation
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('Application error:', error, errorInfo)
  }
}
```

### **Performance Monitoring**
- Vercel Analytics integration
- Supabase performance metrics
- Stripe payment analytics
- User behavior tracking

---

## 🧪 Testing Strategy

### **Testing Framework**
```typescript
// Unit tests
- Component testing with React Testing Library
- Function testing with Jest
- API testing with Supertest

// Integration tests
- End-to-end workflow testing
- Payment flow testing
- User authentication testing

// Manual testing
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance
```

---

## 📚 Documentation & Maintenance

### **Code Documentation**
- TypeScript type definitions
- JSDoc comments
- API documentation
- Component documentation

### **User Documentation**
- User guides and tutorials
- FAQ system
- Video tutorials
- Support documentation

---

*This technical specification provides detailed implementation information for the DisasterShield platform. For specific implementation questions or custom development requests, please contact the development team.*
