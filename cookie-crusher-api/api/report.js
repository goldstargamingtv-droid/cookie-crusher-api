// Cookie Crusher - Report Missed Popup API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hostname, url, timestamp, userAgent } = req.body;

    if (!hostname) {
      return res.status(400).json({ error: 'Hostname is required' });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('popup_reports')
      .insert({
        hostname,
        url: url || null,
        user_agent: userAgent || null,
        reported_at: timestamp || new Date().toISOString(),
        status: 'pending'
      });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save report' });
    }

    return res.status(200).json({ success: true, message: 'Report submitted' });
  } catch (error) {
    console.error('Report error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
