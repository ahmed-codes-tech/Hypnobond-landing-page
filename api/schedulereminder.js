// Vercel-style serverless function stub — Section 7 of the implementation
// guide. NOT functional yet: it requires credentials that don't exist in
// this project (Twilio account SID + auth token, SendGrid API key — see
// Section 14, "Handoff Summary") and a real database (Supabase/Airtable —
// also unconfirmed per Section 14). Wiring fake/placeholder credentials in
// here would silently fail or, worse, look like it works — so this stub
// documents the exact contract instead and returns 501 until it's wired up.
//
// Expected request body: { session_id, channel, contact, delay }
//   delay: '30min' | 'evening' | 'tomorrow'  (mapped to a send_at timestamp
//          per Section 7's delay map — 'evening'/'tomorrow' need the
//          caller's timezone, e.g. via IP geolocation, to compute correctly)
//
// Once real credentials exist, this should:
//   1. Validate session_id exists in the sessions table.
//   2. Compute send_at from `delay`.
//   3. Enqueue a job (Inngest / Trigger.dev / Vercel Cron) that, when fired,
//      sends the SMS (Twilio) or email (SendGrid) with the reflect URL,
//      then sets reminder_contact = null on that session row (Section 6:
//      "Delete it after the reminder is sent").
//   4. Rate-limit to 10 requests per IP per hour (Section 11).

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(501).json({
    error: 'Not implemented',
    reason: 'Reminder delivery (Twilio/SendGrid) and session storage (Supabase/Airtable) credentials have not been provided yet — see Section 14 of the implementation guide.',
  });
};
