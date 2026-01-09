// Check if email has valid Pro license
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required', valid: false });
    }

    // Check license in Supabase
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('product', 'cookie-crusher-pro')
      .eq('active', true)
      .single();

    if (error || !data) {
      return res.status(200).json({ valid: false });
    }

    // Update last_checked timestamp
    await supabase
      .from('licenses')
      .update({ last_checked: new Date().toISOString() })
      .eq('id', data.id);

    return res.status(200).json({
      valid: true,
      license_key: data.license_key,
      created_at: data.created_at
    });

  } catch (error) {
    console.error('License check error:', error);
    return res.status(500).json({ error: 'Server error', valid: false });
  }
};
