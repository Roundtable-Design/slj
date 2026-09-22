import { COURSE_INFO_EMAIL, COURSE_TITLE } from "@/lib/site-branding";
import { TFTW_UNSUBSCRIBE_URL } from "@/lib/mailchimp";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function courseWelcomeEmailSubject(): string {
  return `You're in — ${COURSE_TITLE}`;
}

export function courseWelcomeEmailText(params: {
  name?: string | null;
}): string {
  const greeting = params.name?.trim()
    ? `Hello ${params.name.trim()},`
    : "Hello,";
  return [
    greeting,
    "",
    `You're signed up for ${COURSE_TITLE}.`,
    "",
    "Start reading here: https://slj.talksfromthewarehouse.co.uk/course",
    "",
    "We've also added you to the Talks From The Warehouse email list so you receive the talks when they're published. If you already subscribed, nothing changes.",
    "",
    `Prefer not to get the talks? Unsubscribe here: ${TFTW_UNSUBSCRIBE_URL}`,
    `That won't remove your ${COURSE_TITLE} course account.`,
    "",
    "With thanks,",
    "Talks From The Warehouse",
  ].join("\n");
}

export function courseWelcomeEmailHtml(params: {
  name?: string | null;
}): string {
  const greeting = params.name?.trim()
    ? `Hello ${escapeHtml(params.name.trim())},`
    : "Hello,";
  const unsub = escapeHtml(TFTW_UNSUBSCRIBE_URL);
  const title = escapeHtml(COURSE_TITLE);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;color:#000;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:40px 36px 32px 36px;font-family:Georgia,'Times New Roman',Times,serif;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(0,0,0,0.45);">
                Talks From The Warehouse
              </p>
              <h1 style="margin:16px 0 0 0;font-size:28px;line-height:1.15;font-weight:600;color:#000;">
                ${title}
              </h1>
              <p style="margin:28px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(0,0,0,0.75);">
                ${greeting}
              </p>
              <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(0,0,0,0.65);">
                You&rsquo;re signed up for ${title}.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0 0;">
                <tr>
                  <td align="center" style="background:#000;">
                    <a href="https://slj.talksfromthewarehouse.co.uk/course" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:500;line-height:1;color:#ffffff;text-decoration:none;">
                      Start reading
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(0,0,0,0.65);">
                We&rsquo;ve also added you to the Talks From The Warehouse email list so you receive the talks when they&rsquo;re published. If you already subscribed, nothing changes.
              </p>
              <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:rgba(0,0,0,0.55);">
                Prefer not to get the talks?
                <a href="${unsub}" style="color:#000;">Unsubscribe here</a>.
                That won&rsquo;t remove your ${title} course account.
              </p>
              <p style="margin:28px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(0,0,0,0.65);">
                With thanks,<br />Talks From The Warehouse
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendCourseWelcomeEmail(params: {
  email: string;
  name?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Resend API key is not configured" };
  }

  const from =
    process.env.AUTH_EMAIL_FROM ??
    `Talks From The Warehouse <${COURSE_INFO_EMAIL}>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.email,
      subject: courseWelcomeEmailSubject(),
      html: courseWelcomeEmailHtml({ name: params.name }),
      text: courseWelcomeEmailText({ name: params.name }),
    }),
  });

  if (!res.ok) {
    return {
      ok: false,
      error: "Resend error: " + JSON.stringify(await res.json()),
    };
  }
  return { ok: true };
}
