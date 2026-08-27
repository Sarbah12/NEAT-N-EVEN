/**
 * Booking enquiry -> email, via Resend.
 *
 * Runs as a Vercel serverless function at /api/book. The Resend API key is a
 * SECRET and must never appear in the repo or in client-side JavaScript — a key
 * shipped to the browser can be lifted by anyone viewing source and used to send
 * mail as you. It is read from the environment instead:
 *
 *   RESEND_API_KEY   required   re_xxxxxxxx        (Vercel > Settings > Environment Variables)
 *   RESEND_FROM      optional   "Neat'n'Even <bookings@neatneven.com>"
 *                               defaults to Resend's shared test sender, which
 *                               can only deliver to the account owner's address
 *   BOOKING_TO       optional   defaults to ayisijanet5@gmail.com
 *
 * Handles both paths:
 *   - fetch() with JSON  -> replies with JSON (the normal, JS-enabled path)
 *   - a plain form POST  -> 303 redirect to /thank-you/ (works without JS)
 */

const TO_DEFAULT = 'ayisijanet5@gmail.com';
const FROM_DEFAULT = 'Neat\'n\'Even Bookings <onboarding@resend.dev>';

const FIELDS = ['name', 'email', 'phone', 'service', 'date', 'location', 'people', 'message'];

const LABELS = {
  name: 'Name', email: 'Email', phone: 'Phone / WhatsApp', service: 'Service',
  date: 'Date of occasion', location: 'Location', people: 'Number of faces',
  message: 'Details'
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function validate(d) {
  const errors = [];
  const name = (d.name || '').trim();
  const email = (d.email || '').trim();
  const phone = (d.phone || '').trim();
  const service = (d.service || '').trim();

  if (name.length < 2) errors.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push('email');
  if (phone.replace(/\D/g, '').length < 9) errors.push('phone');
  if (!service) errors.push('service');
  // guard against someone pasting a novel into the inbox
  if ((d.message || '').length > 4000) errors.push('message');
  return errors;
}

function buildHtml(d) {
  const rows = FIELDS
    .filter((k) => (d[k] || '').toString().trim())
    .map((k) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #eee;color:#6b6360;
                   font:500 12px/1.4 -apple-system,Segoe UI,Arial,sans-serif;
                   letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;
                   vertical-align:top">${esc(LABELS[k] || k)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #eee;color:#16110f;
                   font:400 15px/1.55 -apple-system,Segoe UI,Arial,sans-serif">
          ${esc(d[k]).replace(/\n/g, '<br>')}</td>
      </tr>`)
    .join('');

  return `<!doctype html><html><body style="margin:0;background:#f8f4f0;padding:28px 12px">
    <table role="presentation" cellpadding="0" cellspacing="0"
           style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;
                  box-shadow:0 2px 10px rgba(22,17,15,.08)">
      <tr><td style="background:#16110f;padding:22px 24px">
        <div style="color:#e9d2d4;font:500 11px/1 -apple-system,Segoe UI,Arial,sans-serif;
                    letter-spacing:.22em;text-transform:uppercase">New booking enquiry</div>
        <div style="color:#f8f4f0;font:600 21px/1.3 Georgia,serif;margin-top:7px">
          Neat&rsquo;n&rsquo;Even Beauty Clinic</div>
      </td></tr>
      <tr><td style="padding:8px 8px 4px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>
      </td></tr>
      <tr><td style="padding:16px 24px 24px;color:#6b6360;
                     font:400 13px/1.6 -apple-system,Segoe UI,Arial,sans-serif">
        Reply to this email to answer ${esc((d.name || '').trim().split(' ')[0] || 'them')} directly.
        Sent from the booking form at neatneven.com.
      </td></tr>
    </table></body></html>`;
}

function buildText(d) {
  return FIELDS
    .filter((k) => (d[k] || '').toString().trim())
    .map((k) => `${LABELS[k] || k}: ${d[k]}`)
    .join('\n') + '\n\nSent from the booking form at neatneven.com';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  // A plain form POST arrives urlencoded; fetch() sends JSON. Vercel parses both.
  const wantsJson = (req.headers['accept'] || '').includes('application/json');

  const fail = (status, error) => {
    if (wantsJson) return res.status(status).json({ ok: false, error });
    res.setHeader('Location', '/contact/?sent=error');
    return res.status(303).end();
  };

  // honeypot: hidden from people, so anything here is a bot. Pretend success.
  if ((body._honey || '').toString().trim()) {
    if (wantsJson) return res.status(200).json({ ok: true });
    res.setHeader('Location', '/thank-you/');
    return res.status(303).end();
  }

  const errors = validate(body);
  if (errors.length) return fail(400, `Invalid or missing: ${errors.join(', ')}`);

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[book] RESEND_API_KEY is not set in the environment');
    return fail(503, 'Email is not configured yet');
  }

  const data = {};
  FIELDS.forEach((k) => { data[k] = (body[k] == null ? '' : String(body[k])).trim(); });

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || FROM_DEFAULT,
        to: [process.env.BOOKING_TO || TO_DEFAULT],
        reply_to: data.email,           // hitting Reply answers the client
        subject: `Booking enquiry — ${data.service} — ${data.name}`,
        html: buildHtml(data),
        text: buildText(data)
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('[book] Resend rejected the send:', r.status, detail.slice(0, 400));
      // Surface Resend's own reason on configuration errors (bad key, sender not
      // verified, sandbox recipient limits). These are the owner's to fix and the
      // text carries no secret — the key is never echoed back. Genuine 5xx
      // outages stay generic.
      let reason = '';
      if (r.status >= 400 && r.status < 500) {
        try { reason = (JSON.parse(detail).message || '').slice(0, 200); }
        catch (e) { reason = detail.slice(0, 200); }
      }
      return fail(502, reason ? `Email service rejected the send: ${reason}` : 'Could not send the enquiry');
    }
  } catch (err) {
    console.error('[book] Resend request failed:', err && err.message);
    return fail(502, 'Could not send the enquiry');
  }

  if (wantsJson) return res.status(200).json({ ok: true });
  res.setHeader('Location', '/thank-you/');
  return res.status(303).end();
};
