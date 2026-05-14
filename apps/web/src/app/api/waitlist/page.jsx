import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function action({ request }) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
    if (!sql) {
      return new Response(JSON.stringify({ error: 'Database not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS waitlist_emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const existing = await sql`SELECT id FROM waitlist_emails WHERE email = ${email}`;
    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: "You're already on the list! We'll be in touch." }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await sql`INSERT INTO waitlist_emails (email) VALUES (${email})`;

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Mato <waitlist@usemato.com>',
          to: email,
          subject: "You're on the Mato waitlist 🍅",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 48px 32px; background: #ffffff;">
              <div style="margin-bottom: 32px;">
                <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.04em; color: #0a0a0a;">mat<span style="color: #D63B2A;">o</span></span>
              </div>
              <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.04em; color: #0a0a0a; margin: 0 0 16px; line-height: 1.1;">
                You're on the list.
              </h1>
              <p style="font-size: 16px; color: #888; line-height: 1.6; margin: 0 0 32px;">
                We'll reach out when MatoPilot is ready for you. In the meantime, get ready — your pipeline is about to change.
              </p>
              <div style="border-top: 1px solid #f0f0f0; padding-top: 24px; margin-top: 8px;">
                <p style="font-size: 13px; color: #bbb; margin: 0;">© 2026 Mato, Inc.</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Email send failed (non-fatal):', emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true, message: "You're on the list! Check your inbox." }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Waitlist error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.', detail: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default function WaitlistApiRoute() {
  return null;
}
