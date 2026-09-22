import { COURSE_INFO_EMAIL } from "@/lib/site-branding";
import { TFTW_UNSUBSCRIBE_URL } from "@/lib/mailchimp";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function tftwWelcomeEmailSubject(): string {
  return "Welcome to Talks From The Warehouse";
}

export function tftwWelcomeEmailText(): string {
  return [
    "Hello,",
    "",
    "Thank you for joining Talks From The Warehouse.",
    "",
    "You'll receive a short talk by email each day — something you can listen to at your own pace, whenever it suits.",
    "",
    `You can unsubscribe any time: ${TFTW_UNSUBSCRIBE_URL}`,
    "",
    "With thanks,",
    "Talks From The Warehouse",
  ].join("\n");
}

export function tftwWelcomeEmailHtml(): string {
  const unsub = escapeHtml(TFTW_UNSUBSCRIBE_URL);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to Talks From The Warehouse</title>
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
              <p style="margin:28px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(0,0,0,0.75);">
                Hello,
              </p>
              <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(0,0,0,0.65);">
                Thank you for joining Talks From The Warehouse.
              </p>
              <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(0,0,0,0.65);">
                You&rsquo;ll receive a short talk by email each day &mdash; something you can listen to at your own pace, whenever it suits.
              </p>
              <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:rgba(0,0,0,0.55);">
                You can unsubscribe any time:
                <a href="${unsub}" style="color:#000;">unsubscribe here</a>.
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

export async function sendTftwWelcomeEmail(params: {
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Resend API key is not configured" };
  }

  const fromAddress =
    process.env.TFTW_WELCOME_FROM?.trim() ||
    `Talks From The Warehouse <${COURSE_INFO_EMAIL}>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: params.email,
      subject: tftwWelcomeEmailSubject(),
      html: tftwWelcomeEmailHtml(),
      text: tftwWelcomeEmailText(),
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
