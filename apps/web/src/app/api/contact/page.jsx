import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function action({ request }) {
  try {
    const body = await request.json();
    const name    = (body.name    || '').trim();
    const email   = (body.email   || '').trim().toLowerCase();
    const message = (body.message || '').trim();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Please enter your name.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
    if (!sql) {
      return new Response(JSON.stringify({ error: 'Database not configured.' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS contact_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`INSERT INTO contact_leads (name, email, message) VALUES (${name}, ${email}, ${message})`;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Notify the team
      resend.emails.send({
        from: 'Mato Site <hello@usemato.com>',
        to: 'hello@usemato.com',
        subject: `New lead: ${name}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;background:#0a0a0a;color:#fff;border-radius:12px;">
            <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#666;margin:0 0 28px;font-family:monospace;">● New discovery call request</p>
            <h2 style="font-size:24px;font-weight:700;letter-spacing:-0.03em;margin:0 0 24px;color:#fff;">${name}</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:13px;color:#666;width:80px;">Email</td><td style="padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:13px;color:#fff;">${email}</td></tr>
              <tr><td style="padding:10px 0;font-size:13px;color:#666;vertical-align:top;">Message</td><td style="padding:10px 0;font-size:13px;color:#fff;">${message || '—'}</td></tr>
            </table>
          </div>
        `,
      }).catch(console.error);

      // Confirm to the lead
      resend.emails.send({
        from: 'Mato <hello@usemato.com>',
        to: email,
        subject: 'We got your message — Mato',
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:48px 32px;background:#ffffff;">
            <div style="margin-bottom:32px;">
              <span style="font-size:22px;font-weight:800;letter-spacing:-0.04em;color:#0a0a0a;">mato</span>
            </div>
            <h1 style="font-size:26px;font-weight:700;letter-spacing:-0.03em;color:#0a0a0a;margin:0 0 16px;line-height:1.1;">
              We'll be in touch, ${name.split(' ')[0]}.
            </h1>
            <p style="font-size:16px;color:#888;line-height:1.6;margin:0 0 32px;">
              Thanks for reaching out. We'll review your message and get back to you within one business day to set up a call.
            </p>
            <div style="border-top:1px solid #f0f0f0;padding-top:24px;">
              <p style="font-size:13px;color:#bbb;margin:0;">© 2026 Mato Studio</p>
            </div>
          </div>
        `,
      }).catch(console.error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Contact error:', err);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.', detail: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
