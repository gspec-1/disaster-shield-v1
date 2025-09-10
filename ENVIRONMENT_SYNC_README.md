# 🔧 Environment Variables Sync System

## 🎯 **Problem Solved**

Previously, when you updated your `.env` file, you had to manually update environment variables in both:
- **Vercel** (for frontend)
- **Supabase** (for backend/Edge Functions)

This was time-consuming and error-prone.

## ✅ **Solution**

I've created an automated sync system that reads your `.env` file and automatically updates both Vercel and Supabase with the correct environment variables.

---

## 🚀 **Quick Start**

### **1. Setup (One-time)**
```bash
npm run env:setup
```
This installs the required CLI tools (Vercel CLI and Supabase CLI).

### **2. Sync Environment Variables**
```bash
npm run env:sync
```
This reads your `.env` file and syncs all variables to both Vercel and Supabase.

### **3. Redeploy**
```bash
# Redeploy Vercel (frontend)
# Go to Vercel Dashboard → Deployments → Redeploy

# Redeploy Supabase Functions (backend)
npm run deploy:all-functions
```

---

## 📋 **Available Commands**

| Command | Description |
|---------|-------------|
| `npm run env:setup` | Install required CLI tools |
| `npm run env:sync` | Sync all environment variables |
| `npm run env:sync:vercel` | Sync only to Vercel |
| `npm run env:sync:supabase` | Sync only to Supabase |
| `npm run env:status` | Check current status |

---

## 🔄 **How It Works**

### **Environment Variables Mapped**

#### **Vercel (Frontend)**
- `VITE_RESEND_API_KEY` → Vercel Environment Variable
- `VITE_RESEND_FROM` → Vercel Environment Variable
- `VITE_USE_DIRECT_RESEND` → Vercel Environment Variable
- `VITE_FORCE_REAL_EMAILS` → Vercel Environment Variable
- `VITE_STRIPE_PUBLISHABLE_KEY` → Vercel Environment Variable
- `VITE_SUPABASE_URL` → Vercel Environment Variable
- `VITE_SUPABASE_ANON_KEY` → Vercel Environment Variable
- `VITE_APP_URL` → Vercel Environment Variable
- `VITE_TWILIO_ACCOUNT_SID` → Vercel Environment Variable

#### **Supabase (Backend)**
- `VITE_RESEND_API_KEY` → `RESEND_API_KEY` (Supabase Secret)
- `VITE_RESEND_FROM` → `RESEND_FROM` (Supabase Secret)
- `STRIPE_SECRET_KEY` → `STRIPE_SECRET_KEY` (Supabase Secret)
- `STRIPE_WEBHOOK_SECRET` → `STRIPE_WEBHOOK_SECRET` (Supabase Secret)
- `TWILIO_AUTH_TOKEN` → `TWILIO_AUTH_TOKEN` (Supabase Secret)
- `TWILIO_PHONE_NUMBER` → `TWILIO_PHONE_NUMBER` (Supabase Secret)
- `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY` (Supabase Secret)
- `MOCK_EMAIL_SERVICE` → `MOCK_EMAIL_SERVICE` (Supabase Secret)

---

## 🎯 **Your Current Issue**

You updated your Resend account credentials in `.env`:
```
VITE_RESEND_API_KEY=re_SMtRfPQ7_FFNCUyuj7U6DUEUdNFyQJqRv
VITE_RESEND_FROM=info@disastershield.net
```

But these changes weren't reflected in production because:
1. ✅ Vercel environment variables were updated manually
2. ❌ Supabase secrets were not updated

---

## 🔧 **Fix Your Current Issue**

### **Step 1: Sync Environment Variables**
```bash
npm run env:sync
```

### **Step 2: Redeploy Supabase Functions**
```bash
npm run deploy:all-functions
```

### **Step 3: Test Email Sending**
Try sending a test email to verify the new Resend account is working.

---

## 📊 **Status Check**

Check what environment variables are currently set:
```bash
npm run env:status
```

This will show you:
- ✅ Which variables are set in your `.env` file
- ❌ Which variables are missing
- 📊 Current sync status

---

## 🔒 **Security**

- ✅ Your `.env` file stays in `.gitignore` (never committed to Git)
- ✅ Environment variables are securely stored in Vercel and Supabase
- ✅ No sensitive data is exposed in the sync process
- ✅ Each platform (Vercel/Supabase) has its own secure storage

---

## 🚨 **Troubleshooting**

### **"Command not found" errors**
```bash
npm run env:setup
```

### **"Permission denied" errors**
Make sure you're logged into both Vercel and Supabase:
```bash
vercel login
supabase login
```

### **"Environment variable already exists"**
The script will automatically update existing variables.

### **"Failed to set secret"**
Check your Supabase project connection:
```bash
supabase status
```

---

## 🔄 **Workflow**

### **When you update .env file:**
1. Edit your `.env` file
2. Run `npm run env:sync`
3. Redeploy if needed:
   - Vercel: Dashboard → Redeploy
   - Supabase: `npm run deploy:all-functions`

### **For new environment variables:**
1. Add to `.env` file
2. Add to the sync script if it's a new variable type
3. Run `npm run env:sync`

---

## 📝 **Example Usage**

```bash
# Check current status
npm run env:status

# Sync everything
npm run env:sync

# Sync only to Vercel
npm run env:sync:vercel

# Sync only to Supabase
npm run env:sync:supabase

# Redeploy functions
npm run deploy:all-functions
```

---

## 🎉 **Benefits**

- ✅ **Automated**: No more manual copying/pasting
- ✅ **Consistent**: Same variables across all environments
- ✅ **Secure**: Variables stay in `.gitignore`
- ✅ **Fast**: One command syncs everything
- ✅ **Reliable**: Reduces human error
- ✅ **Maintainable**: Easy to add new variables

---

**🚀 Your environment variable management is now fully automated!**
