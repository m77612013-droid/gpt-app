import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Contact form backend.
 *
 * Uses Resend (https://resend.com) — free tier: 3000 emails/month.
 *
 * Setup:
 *   1. Sign up at resend.com
 *   2. Add your domain or use their sandbox domain for testing
 *   3. Get your API key from resend.com/api-keys
 *   4. Set RESEND_API_KEY in .env.local
 *   5. Set CONTACT_EMAIL_TO=your@email.com (where you receive messages)
 *   6. Set CONTACT_EMAIL_FROM=noreply@yourdomain.com
 */

export async function POST(request: NextRequest) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailTo      = process.env.CONTACT_EMAIL_TO;
  const emailFrom    = process.env.CONTACT_EMAIL_FROM ?? "noreply@janarewards.xyz";

  // If Resend is not configured, return a clear error (don't silently fail)
  if (!resendApiKey || !emailTo) {
    console.warn("[contact] Resend not configured — RESEND_API_KEY or CONTACT_EMAIL_TO missing");
    return NextResponse.json(
      { error: "خدمة البريد الإلكتروني غير مهيأة حالياً." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  // Validate & sanitize
  const b = body as Record<string, unknown>;
  const name    = String(b.name    ?? "").trim().slice(0, 100);
  const email   = String(b.email   ?? "").trim().slice(0, 200);
  const subject = String(b.subject ?? "").trim().slice(0, 200);
  const message = String(b.message ?? "").trim().slice(0, 2000);

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة." }, { status: 400 });
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح." }, { status: 400 });
  }

  // Send via Resend REST API
  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    emailFrom,
      to:      [emailTo],
      reply_to: email,
      subject: `[جنى - رسالة تواصل] ${subject}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color:#3b82f6;">رسالة جديدة من نموذج التواصل</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px 0; color:#64748b; width:120px;">الاسم</td><td><strong>${name}</strong></td></tr>
            <tr><td style="padding:8px 0; color:#64748b;">البريد</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px 0; color:#64748b;">الموضوع</td><td>${subject}</td></tr>
          </table>
          <hr style="border-color:#1e293b; margin:16px 0;"/>
          <p style="white-space:pre-wrap; line-height:1.7;">${message}</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[contact] Resend error:", res.status, err);
    return NextResponse.json(
      { error: "فشل إرسال الرسالة. حاول مجدداً لاحقاً." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
