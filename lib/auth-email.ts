import {
  COURSE_AUTHOR,
  COURSE_SUBTITLE,
  COURSE_TITLE,
  TALKS_FROM_THE_WAREHOUSE_LABEL,
} from "@/lib/site-branding";

/** Auth.js / Resend magic-link email — matches the site’s calm, typography-first look. */
export function magicLinkEmailHtml(params: { url: string }): string {
  const { url } = params;
  const safeUrl = escapeHtml(url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign in to ${escapeHtml(COURSE_TITLE)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;color:#000;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:40px 36px 32px 36px;font-family:Georgia,'Times New Roman',Times,serif;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(0,0,0,0.45);">
                ${escapeHtml(COURSE_SUBTITLE)}
              </p>
              <h1 style="margin:16px 0 0 0;font-size:32px;line-height:1.1;font-weight:600;color:#000;">
                ${escapeHtml(COURSE_TITLE)}
              </h1>
              <p style="margin:12px 0 0 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:18px;line-height:1.35;color:rgba(0,0,0,0.65);">
                ${escapeHtml(COURSE_AUTHOR)}
              </p>
              <p style="margin:28px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(0,0,0,0.65);">
                You asked for a secure link to open the digital edition of this course — your private notes, reading progress, and the full discussion material.
              </p>
              <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(0,0,0,0.65);">
                Click below to sign in. The link works once and expires after a short time.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0 0 0;">
                <tr>
                  <td align="center" style="background:#000;">
                    <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:500;line-height:1;color:#ffffff;text-decoration:none;">
                      Sign in to the course
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:rgba(0,0,0,0.45);">
                If the button does not work, paste this link into your browser:<br />
                <a href="${safeUrl}" style="color:#000;word-break:break-all;">${safeUrl}</a>
              </p>
              <p style="margin:24px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:rgba(0,0,0,0.45);">
                If you did not request this email, you can safely ignore it. No one else can use this link for your account.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px 28px 36px;border-top:1px solid #e5e7eb;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:rgba(0,0,0,0.45);">
              ${escapeHtml(COURSE_TITLE)} · ${escapeHtml(TALKS_FROM_THE_WAREHOUSE_LABEL)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function magicLinkEmailText(params: { url: string }): string {
  const { url } = params;
  return [
    `${COURSE_SUBTITLE}`,
    COURSE_TITLE,
    COURSE_AUTHOR,
    "",
    "You asked for a secure link to open the digital edition of this course — your private notes, reading progress, and the full discussion material.",
    "",
    "Sign in here (the link works once and expires after a short time):",
    url,
    "",
    "If you did not request this email, you can safely ignore it.",
    "",
    `${COURSE_TITLE} · ${TALKS_FROM_THE_WAREHOUSE_LABEL}`,
  ].join("\n");
}

export function magicLinkEmailSubject(): string {
  return `Sign in to ${COURSE_TITLE}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
