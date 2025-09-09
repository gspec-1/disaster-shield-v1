# 🛡️ DisasterShield - Application Workflow Diagram

## 📋 Complete User Journey Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DISASTERSHIELD PLATFORM                              │
│                         Complete Application Workflow                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLIENT        │    │  CONTRACTOR     │    │    ADMIN        │
│ (Homeowner)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 1. REGISTRATION │    │ 1. REGISTRATION │    │ 1. REGISTRATION │
│    & LOGIN      │    │    & LOGIN      │    │    & LOGIN      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 2. CLAIM FILING │    │ 2. PROFILE SETUP│    │ 2. SYSTEM ACCESS│
│   (Intake)      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 3. MEDIA UPLOAD │    │ 3. JOB BROWSING │    │ 3. DASHBOARD    │
│ (Photos/Voice)  │    │                 │    │   MANAGEMENT    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 4. CONTRACTOR   │    │ 4. ESTIMATE     │    │ 4. ANALYTICS    │
│   MATCHING      │    │  SUBMISSION     │    │   & REPORTS     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 5. ESTIMATE     │    │ 5. PROJECT      │    │ 5. USER         │
│   REVIEW        │    │   MANAGEMENT    │    │   MANAGEMENT    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 6. PAYMENT      │    │ 6. WORK         │    │ 6. SYSTEM       │
│   PROCESSING    │    │   EXECUTION     │    │   CONFIGURATION │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 7. FNOL         │    │ 7. COMPLETION   │    │ 7. MONITORING   │
│   GENERATION    │    │   & REPORTING   │    │   & MAINTENANCE │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Detailed Workflow Steps

### **CLIENT WORKFLOW**
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT JOURNEY                          │
└─────────────────────────────────────────────────────────────────┘

1. REGISTRATION & AUTHENTICATION
   ┌─────────────────┐
   │ Sign Up/Login   │
   │ Email Verify    │
   │ Profile Create  │
   └─────────────────┘
            │
            ▼
2. CLAIM FILING (INTAKE)
   ┌─────────────────┐
   │ Property Details│
   │ Damage Info     │
   │ Insurance Info  │
   │ Contact Details │
   └─────────────────┘
            │
            ▼
3. MEDIA UPLOAD
   ┌─────────────────┐
   │ Photo Upload    │
   │ Voice Notes     │
   │ File Storage    │
   └─────────────────┘
            │
            ▼
4. CONTRACTOR MATCHING
   ┌─────────────────┐
   │ Auto Matching   │
   │ Top 3 Selection │
   │ Email Invites   │
   └─────────────────┘
            │
            ▼
5. ESTIMATE REVIEW
   ┌─────────────────┐
   │ Compare Estimates│
   │ View Details    │
   │ Accept/Reject   │
   └─────────────────┘
            │
            ▼
6. PAYMENT PROCESSING
   ┌─────────────────┐
   │ Security Deposit│
   │ Service Fee     │
   │ Repair Cost     │
   │ Stripe Payment  │
   └─────────────────┘
            │
            ▼
7. FNOL GENERATION
   ┌─────────────────┐
   │ Insurance API   │
   │ Document Create │
   │ Auto Submit     │
   │ Status Track    │
   └─────────────────┘
```

### **CONTRACTOR WORKFLOW**
```
┌─────────────────────────────────────────────────────────────────┐
│                      CONTRACTOR JOURNEY                        │
└─────────────────────────────────────────────────────────────────┘

1. REGISTRATION & PROFILE SETUP
   ┌─────────────────┐
   │ Company Info    │
   │ Service Areas   │
   │ Licenses        │
   │ Certifications  │
   └─────────────────┘
            │
            ▼
2. JOB BROWSING
   ┌─────────────────┐
   │ Available Jobs  │
   │ Filter/Search   │
   │ Project Details │
   └─────────────────┘
            │
            ▼
3. ESTIMATE SUBMISSION
   ┌─────────────────┐
   │ Cost Breakdown  │
   │ Timeline        │
   │ Notes/Conditions│
   └─────────────────┘
            │
            ▼
4. PROJECT ASSIGNMENT
   ┌─────────────────┐
   │ Estimate Accept │
   │ Client Contact  │
   │ Work Schedule   │
   └─────────────────┘
            │
            ▼
5. WORK EXECUTION
   ┌─────────────────┐
   │ Site Inspection │
   │ Work Performance│
   │ Progress Updates│
   └─────────────────┘
            │
            ▼
6. COMPLETION & REPORTING
   ┌─────────────────┐
   │ Final Photos    │
   │ Completion Docs │
   │ Client Sign-off │
   └─────────────────┘
```

### **ADMIN WORKFLOW**
```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN JOURNEY                           │
└─────────────────────────────────────────────────────────────────┘

1. SYSTEM ACCESS
   ┌─────────────────┐
   │ Admin Login     │
   │ Role Verification│
   │ Dashboard Access│
   └─────────────────┘
            │
            ▼
2. DASHBOARD MANAGEMENT
   ┌─────────────────┐
   │ System Overview │
   │ User Statistics │
   │ Project Metrics │
   │ Financial Data  │
   └─────────────────┘
            │
            ▼
3. USER MANAGEMENT
   ┌─────────────────┐
   │ User Accounts   │
   │ Role Assignment │
   │ Access Control  │
   └─────────────────┘
            │
            ▼
4. INSURANCE COMPANY MANAGEMENT
   ┌─────────────────┐
   │ Provider Setup  │
   │ API Integration │
   │ Template Config │
   └─────────────────┘
            │
            ▼
5. SYSTEM CONFIGURATION
   ┌─────────────────┐
   │ Payment Settings│
   │ Email Templates │
   │ Notification Rules│
   └─────────────────┘
            │
            ▼
6. MONITORING & MAINTENANCE
   ┌─────────────────┐
   │ System Health   │
   │ Performance     │
   │ Error Tracking  │
   └─────────────────┘
```

## 🔄 Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PAYMENT WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

CLIENT                    STRIPE                    DATABASE
  │                         │                         │
  │ 1. Initiate Payment     │                         │
  ├────────────────────────►│                         │
  │                         │                         │
  │                         │ 2. Create Session       │
  │                         ├────────────────────────►│
  │                         │                         │
  │ 3. Redirect to Checkout │                         │
  │◄────────────────────────┤                         │
  │                         │                         │
  │ 4. Complete Payment     │                         │
  ├────────────────────────►│                         │
  │                         │                         │
  │                         │ 5. Webhook Notification │
  │                         ├────────────────────────►│
  │                         │                         │
  │ 6. Status Update        │                         │
  │◄────────────────────────┤                         │
  │                         │                         │
  │ 7. Notification Email   │                         │
  │◄────────────────────────┤                         │
```

## 🔄 Contractor Matching Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTRACTOR MATCHING FLOW                    │
└─────────────────────────────────────────────────────────────────┘

PROJECT SUBMISSION
        │
        ▼
┌─────────────────┐
│ Geographic      │
│ Filtering       │
│ (Service Areas) │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Expertise       │
│ Matching        │
│ (Damage Types)  │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Capacity        │
│ Checking        │
│ (Availability)  │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Scoring         │
│ Algorithm       │
│ (Multi-factor)  │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Top 3           │
│ Selection       │
│ & Notification  │
└─────────────────┘
```

## 🔄 FNOL Generation Process

```
┌─────────────────────────────────────────────────────────────────┐
│                      FNOL GENERATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

CLIENT                    SYSTEM                    INSURANCE API
  │                         │                         │
  │ 1. Select Insurance     │                         │
  ├────────────────────────►│                         │
  │                         │                         │
  │                         │ 2. Check API Support    │
  │                         ├────────────────────────►│
  │                         │                         │
  │                         │ 3. API Response         │
  │                         │◄────────────────────────┤
  │                         │                         │
  │ 4. Fill FNOL Form       │                         │
  ├────────────────────────►│                         │
  │                         │                         │
  │                         │ 5. Generate Document    │
  │                         │                         │
  │                         │ 6. Submit to API        │
  │                         ├────────────────────────►│
  │                         │                         │
  │                         │ 7. Submission Status    │
  │                         │◄────────────────────────┤
  │                         │                         │
  │ 8. Status Update        │                         │
  │◄────────────────────────┤                         │
```

## 🔄 Real-time Notification System

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION WORKFLOW                       │
└─────────────────────────────────────────────────────────────────┘

EVENT TRIGGER
        │
        ▼
┌─────────────────┐
│ Database        │
│ Change          │
│ (Insert/Update) │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Supabase        │
│ Real-time       │
│ Subscription    │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Frontend        │
│ State Update    │
│ (React Hook)    │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ UI Update       │
│ (Notification   │
│  Bell/Badge)    │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Email/SMS       │
│ Notification    │
│ (Resend/Twilio) │
└─────────────────┘
```

## 🔄 Security & Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

USER REQUEST
        │
        ▼
┌─────────────────┐
│ Authentication  │
│ (Supabase Auth) │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Role Check      │
│ (Profile Table) │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Route Guard     │
│ (ClientRoute/   │
│  AdminRoute)    │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ RLS Policy      │
│ (Database)      │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Access Granted  │
│ or Redirected   │
└─────────────────┘
```

---

*This workflow diagram provides a visual representation of the complete DisasterShield application flow, showing how different user types interact with the system and how data flows between components.*
