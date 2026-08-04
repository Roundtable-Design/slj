# Auth email branding — Simplicity Love & Justice

Magic-link emails are sent via **Auth.js + Resend** with a branded HTML template that matches the site (subtitle, course title, author, black CTA).

Implementation:

- Template: `lib/auth-email.ts`
- Wire-up: `auth.ts` → Resend `sendVerificationRequest`

## Subject

`Sign in to Simplicity Love & Justice`

## From address

Set in Vercel / `.env.local`:

```bash
AUTH_EMAIL_FROM="Simplicity Love & Justice <info@talksfromthewarehouse.co.uk>"
AUTH_RESEND_KEY=re_...
```

`talksfromthewarehouse.co.uk` must stay verified in Resend. The test domain `onboarding@resend.dev` can only send to the Resend account owner.

## How to test

1. Open `/auth/sign-in`, request a link.
2. Confirm the email shows the course title, short explanation, and a black **Sign in to the course** button.
3. Click the link and confirm you land signed in.

## Plain text

A plain-text part is included for clients that prefer it (same copy + raw URL).
