// Vercel-style serverless function stub for Screen 4 (Later Feedback)
// submissions. Same caveat as schedule-reminder.js: no database is
// connected yet (Section 14 — Supabase vs Airtable unconfirmed).
//
// Expected request body: { session_id, after_q1, after_q2, after_q3 }
//
// Once a database exists, this should:
//   1. Validate session_id exists in the sessions table (Section 11) — on
//      no match, the *frontend* already shows a neutral "This link has
//      expired" message (reflect.html), so this endpoint can simply 404
//      without needing its own user-facing copy.
//   2. Update that row's after_q1/after_q2/after_q3, reflect_opened_at,
//      reflect_submitted = true (Section 6 data model).

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(501).json({
    error: 'Not implemented',
    reason: 'No database is connected yet — see Section 14 of the implementation guide (Supabase vs Airtable unconfirmed).',
  });
};
