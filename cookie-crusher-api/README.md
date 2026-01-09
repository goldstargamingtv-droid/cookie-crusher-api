# Cookie Crusher API

Backend API for Cookie Crusher Chrome Extension.

## Stack
- **Vercel** - Serverless functions
- **Supabase** - Database (licenses)
- **Stripe** - Payments

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Get your credentials from Settings > API:
   - `SUPABASE_URL` - Project URL
   - `SUPABASE_SERVICE_KEY` - service_role key (secret!)

### 2. Create Stripe Payment Link

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Products > Add Product:
   - Name: "Cookie Crusher Pro"
   - Price: $2.99 (one-time)
3. Create a Payment Link for this product
4. Get your API keys from Developers > API keys:
   - `STRIPE_SECRET_KEY` - Secret key

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd cookie-crusher-api
vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET

# Deploy to production
vercel --prod
```

### 4. Set Up Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-project.vercel.app/api/webhook`
3. Select event: `checkout.session.completed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Update Extension

Update the API URL in `src/background.js`:
```js
const response = await fetch('https://your-project.vercel.app/api/check-license', {
```

### 6. Deploy Privacy Policy

Push `privacy-policy.html` to your GitHub Pages repo:
```
https://goldstargamingtv-droid.github.io/cookie-crusher-api/privacy-policy.html
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/check-license` | POST | Verify Pro license |
| `/api/webhook` | POST | Stripe webhook |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Testing

```bash
# Check health
curl https://your-project.vercel.app/api/health

# Test license check
curl -X POST https://your-project.vercel.app/api/check-license \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

