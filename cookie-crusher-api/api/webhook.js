// Stripe webhook handler - creates license on successful payment
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Generate a random license key
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-'); // Format: XXXX-XXXX-XXXX-XXXX
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const email = session.customer_details?.email || session.customer_email;
      
      if (!email) {
        console.error('No email found in session');
        return res.status(400).json({ error: 'No email in session' });
      }

      // Check if license already exists
      const { data: existing } = await supabase
        .from('licenses')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('product', 'cookie-crusher-pro')
        .single();

      if (existing) {
        console.log('License already exists for:', email);
        return res.status(200).json({ received: true, existing: true });
      }

      // Create new license
      const licenseKey = generateLicenseKey();
      
      const { error: insertError } = await supabase
        .from('licenses')
        .insert({
          email: email.toLowerCase().trim(),
          license_key: licenseKey,
          product: 'cookie-crusher-pro',
          stripe_session_id: session.id,
          stripe_customer_id: session.customer,
          amount_paid: session.amount_total,
          currency: session.currency,
          active: true,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to create license:', insertError);
        return res.status(500).json({ error: 'Failed to create license' });
      }

      console.log('License created for:', email, 'Key:', licenseKey);
      return res.status(200).json({ received: true, created: true });

    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Processing error' });
    }
  }

  // Return 200 for other event types
  return res.status(200).json({ received: true });
};

// Helper to get raw body for Stripe signature verification
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

// Disable body parsing for this route (needed for Stripe signature)
module.exports.config = {
  api: {
    bodyParser: false
  }
};
