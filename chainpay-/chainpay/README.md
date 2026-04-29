# ChainPay — Crypto Invoice & Payment SaaS
### Built for Nigerian founders. Powered by Paystack.

---

## Features
- Sign up / sign in (Supabase Auth)
- Create & send professional crypto invoices (ETH, USDC, BTC, USDT)
- Public client payment page — crypto wallet + card via Paystack
- Email notifications via Resend (free 3,000/month)
- Subscription plans: Free (3/mo), Pro ($19/mo), Business ($49/mo)
- 0.5% transaction fee on every paid invoice
- Referral system — 20% commission per referred Pro user
- Full earnings dashboard
- Persistent storage via Supabase

---

## Deploy Guide — Step by Step

### STEP 1 — GitHub (2 minutes)
1. Go to github.com → sign up or log in
2. Click "New repository" → name it `chainpay` → Create
3. Upload all these project files (drag and drop the unzipped folder)

### STEP 2 — Supabase Database (5 minutes)
1. Go to supabase.com → sign up → New Project
2. Pick a name, password, and region closest to you
3. Wait ~2 minutes for it to spin up
4. Click "SQL Editor" in the left sidebar
5. Paste and run migration 001, then 002, then 003 (one at a time, in order)
   — files are in the supabase/migrations/ folder
6. Go to Settings → API and copy:
   - Project URL → VITE_SUPABASE_URL
   - anon public key → VITE_SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_ROLE_KEY (keep this secret)
7. Go to Authentication → Providers → make sure Email is enabled

### STEP 3 — Vercel Hosting (3 minutes)
1. Go to vercel.com → sign up with your GitHub account
2. Click "Add New Project" → import your chainpay repo
3. Framework preset: Vite
4. Click "Environment Variables" and add all keys from .env.example
   (you'll fill Paystack keys in Step 4)
5. Click Deploy → your app is live!
6. Copy your Vercel URL (e.g. chainpay.vercel.app) → set as VITE_APP_URL
7. Redeploy once after setting VITE_APP_URL

### STEP 4 — Paystack (10 minutes, FREE to sign up)
1. Go to paystack.com → Create a free account with your Nigerian details
2. Complete your business verification (BVN / business registration)
3. Go to Settings → API Keys & Webhooks:
   - Copy Public Key → VITE_PAYSTACK_PUBLIC_KEY
   - Copy Secret Key → PAYSTACK_SECRET_KEY
4. Add webhook URL:
   - URL: https://your-app.vercel.app/api/paystack-webhook
   - Events to enable: charge.success, subscription.create,
     subscription.disable, invoice.payment_failed
5. Create subscription plans:
   - Go to Products → Plans → Create Plan
   - Plan 1: "ChainPay Pro" → $19 → Monthly → copy plan code → VITE_PAYSTACK_PRO_PLAN_CODE
   - Plan 2: "ChainPay Business" → $49 → Monthly → copy plan code → VITE_PAYSTACK_BUSINESS_PLAN_CODE
6. Add all Paystack keys to Vercel → Settings → Environment Variables → Redeploy

### STEP 5 — Resend Emails (3 minutes, FREE)
1. Go to resend.com → sign up
2. API Keys → Create API Key → copy it → RESEND_API_KEY
3. Add to Vercel environment variables → Redeploy
4. Optional: add your domain in Resend to send from your own email address

---

## All Vercel Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_PAYSTACK_PUBLIC_KEY
PAYSTACK_SECRET_KEY
VITE_PAYSTACK_PRO_PLAN_CODE
VITE_PAYSTACK_BUSINESS_PLAN_CODE
RESEND_API_KEY
VITE_APP_URL
```

---

## Revenue Streams

| Stream | Rate | Example |
|---|---|---|
| Pro subscriptions | $19/month per user | 100 users = $1,900/mo |
| Business subscriptions | $49/month per user | 50 users = $2,450/mo |
| Transaction fees | 0.5% per paid invoice | User invoices $10k = $50/mo to you |
| Referral commissions earned | 20% of $19 = $3.80/referral/mo | — |

---

## Project Structure
```
chainpay/
├── api/
│   ├── send-email.js             Email via Resend
│   ├── create-checkout.js        Paystack one-time invoice payment
│   ├── create-subscription.js    Paystack recurring subscription
│   ├── billing-portal.js         Paystack subscription management link
│   └── paystack-webhook.js       All Paystack event handling
├── src/
│   ├── context/AuthContext.jsx   Auth + subscription state
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── email.js
│   │   └── referrals.js
│   ├── components/UI.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── CreateInvoice.jsx
│   │   ├── PayPage.jsx           Crypto + Paystack card payment
│   │   ├── PricingPage.jsx       Plan selector
│   │   ├── auth/AuthPage.jsx
│   │   └── account/AccountPage  Earnings + referral + billing
│   └── App.jsx
├── supabase/migrations/
│   ├── 001_create_invoices.sql
│   ├── 002_subscriptions.sql
│   └── 003_referrals_fees.sql
├── .env.example
├── vercel.json
└── package.json
```
