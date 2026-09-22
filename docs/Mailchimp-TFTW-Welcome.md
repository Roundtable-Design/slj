# Mailchimp — TFTW welcome + SLJ auto-subscribe

**Last updated:** 18 Sep 2026

## Audience

| | |
|--|--|
| Name | Talks From The Warehouse |
| Audience ID | `d25a712438` |
| API DC | `us21` |
| Unsubscribe | https://talksfromthewarehouse.us21.list-manage.com/unsubscribe?u=1c8d690688ecca6278d4b78e4&id=d25a712438 |
| Default From | `info@talksfromthewarehouse.co.uk` (set via API; was `talksfromthewarehouse@round-table.co.uk`) |

Env (Vercel Production + `.env.local`): `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, optional `MAILCHIMP_UNSUBSCRIBE_URL`.

**Rotate the API key** that was pasted in chat (Mailchimp → Account → Extras → API keys), then update env.

## Website signup welcome (Mailchimp journey)

Draft journey **Welcome new contacts** (id `3747`) — trigger: contact signs up to this audience.

- Subject: `Welcome to Talks From The Warehouse`
- From / reply-to: `info@talksfromthewarehouse.co.uk`
- Body (plain): thanks for joining; short talk by email each day; listen at your own pace; unsubscribe in footer. No James name, no course mention.

**Action still needed in Mailchimp UI:** Automations → Welcome new contacts → **Start Journey** (API cannot activate draft journeys). Until started, website form signups will not get this welcome.

## Course signup (SLJ app)

On Auth.js `signIn`, if `emailVerified` is within the last 2 hours:

1. `PUT` member on audience (skip if already subscribed/pending; respect unsubscribed/cleaned)
2. Send Resend welcome (`lib/course-welcome-email.ts`) From `AUTH_EMAIL_FROM` / `info@…`
3. Tag member `course-welcome-sent` so it only sends once

Code: [`lib/mailchimp.ts`](../lib/mailchimp.ts), [`lib/course-onboarding.ts`](../lib/course-onboarding.ts), hook in [`auth.ts`](../auth.ts).

## How to test

1. Start the Mailchimp journey (above).
2. Subscribe a throwaway via the TFTW site form → expect Draft A welcome From `info@…`.
3. Sign up a new course account (fresh email) → expect Mailchimp add + Draft B Resend; second sign-in should not re-send.
4. Confirm an `@example.com` e2e user does not hit Mailchimp.


## Website welcome via webhook (live path)

Mailchimp list webhook on **subscribe** (user + admin sources; API excluded) posts to:

`https://slj.talksfromthewarehouse.co.uk/api/webhooks/mailchimp?secret=…`

which sends the TFTW welcome (Draft A) via Resend From `info@…`.

Leave the Customer Journey **Welcome new contacts** in **draft** to avoid duplicate welcomes, or delete it.
