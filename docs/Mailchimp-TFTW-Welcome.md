# Mailchimp — TFTW welcome + SLJ auto-subscribe

**Last updated:** 20 Oct 2026

## Audience

| | |
|--|--|
| Name | Talks From The Warehouse |
| Audience ID | `d25a712438` |
| API DC | `us21` |
| Unsubscribe | https://talksfromthewarehouse.us21.list-manage.com/unsubscribe?u=1c8d690688ecca6278d4b78e4&id=d25a712438 |
| Default From | `info@talksfromthewarehouse.co.uk` |

Env (Vercel Production + `.env.local`): `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_WEBHOOK_SECRET`, optional `MAILCHIMP_UNSUBSCRIBE_URL`.

**Ops note (7 Oct 2026):** Production `MAILCHIMP_API_KEY` / `MAILCHIMP_AUDIENCE_ID` had trailing `\n` from a past `vercel env add`, which broke API auth (`403`) and stopped SLJ→TFTW auto-subscribe. Values were re-set clean; `lib/mailchimp.ts` now `.trim()`s env on read.

## Website signup welcome (live path)

Mailchimp list webhook on **subscribe** (user + admin sources; **API excluded**) posts to:

`https://slj.talksfromthewarehouse.co.uk/api/webhooks/mailchimp?secret=…`

→ Resend Draft A From `info@…` (`lib/tftw-welcome-email.ts`).

Leave Customer Journey **Welcome new contacts** (id `3747`) in **draft** (or delete) to avoid duplicate welcomes.

## Course signup (SLJ app)

On Auth.js `signIn` (`lib/course-onboarding.ts`):

1. **Always** `ensureTftwSubscriber` (idempotent; case-insensitive user lookup).
2. **Never auto-resubscribe past opt-outs** (James, Oct 2026): if Mailchimp already has the address as `unsubscribed` / `cleaned` / `archived` / etc., leave them alone. Only **new** addresses (HTTP 404) are added. API body uses `status_if_new` only — never `status: subscribed` on an existing member (that field force-resubscribes).
3. Course welcome only when outcome is `added` or `already_subscribed`, `emailVerified` within last 2 hours, and member not tagged `course-welcome-sent`.

Skips `@example.com`. Failures are logged; sign-in never fails because of Mailchimp/Resend.

## Weekly digest recipients

`WEEKLY_DIGEST_TO` = `louis@round-table.co.uk,theodgersfamily@aol.co.uk`  
(Use `@aol.co.uk` only — not `@aol.com`.)

## How to test

1. Webhook smoke (safe address you control):  
   `POST /api/webhooks/mailchimp?secret=…` with `type=subscribe` + `data[email]=…` → one TFTW welcome.
2. Fresh course signup → Mailchimp member + course welcome once; second sign-in does not re-welcome.
3. Existing course user not on list → next sign-in adds to Mailchimp (no welcome if verify older than 2h).
4. Previously unsubscribed / cleaned / archived address → SLJ sign-in does **not** change Mailchimp status (no welcome claiming they were added).
5. `@example.com` e2e user never hits Mailchimp.
