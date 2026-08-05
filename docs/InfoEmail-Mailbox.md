# `info@talksfromthewarehouse.co.uk` — mailbox & Mailchimp handoff

**Audience:** Inkar (and anyone picking up TFW / SLJ email)  
**Last checked:** 5 Aug 2026 (Louis + Cloudways / DNS / Gmail)  
**Related:** [T9 Public Launch](./plans/T9-Public-Launch.md) · [Auth email branding](./AuthEmailBranding.md) · [Tasks.md](./Tasks.md) email items

---

## TL;DR

| Topic | Finding |
|-------|---------|
| Mail host | **Rackspace Email** via **Cloudways** add-on (`emailsrvr.com`) — not Google Workspace |
| Real mailbox | Only **`devotional@talksfromthewarehouse.co.uk`** |
| `info@` | **Alias** → `devotional@` (not its own mailbox) |
| Forwarding | `devotional@` → **`support@round-table.co.uk`** |
| Save copies | Was **off** (inbox looked empty); turn **on** so James’s Apple Mail / Rackspace webmail keep mail |
| Mailchimp From `info@` | OK once domain auth is complete — **DKIM `k1` still missing** |

---

## How mail is routed today

```text
Someone emails info@talksfromthewarehouse.co.uk
        │
        ▼
  Alias (Cloudways → Rackspace)
        │
        ▼
  Mailbox: devotional@talksfromthewarehouse.co.uk
        │
        ▼
  Forward → support@round-table.co.uk
        │
        ├── if "Save copies" ON  → also kept in Rackspace (webmail / Apple Mail)
        └── if "Save copies" OFF → Rackspace inbox stays empty (what we saw)
```

**SLJ app “print version” mailto** and **Auth.js From** both use `info@…` so replies land on this path. Roundtable currently receives them at `support@round-table.co.uk` (and Louis’s Workspace, depending on Google routing).

---

## Where to manage it (Cloudways)

Account: **James Odgers** / login email `talksfromthewarehouse@round-table.co.uk`

1. Log in to [Cloudways](https://platform.cloudways.com/).
2. Left nav → **Integrations** → **Add-Ons** → **Rackspace** (not Account settings).
3. Tabs that matter:
   - **Mailboxes** — only `devotional@…` today; password / **Launch Webmail**
   - **Aliases** — `info@…` → member `devotional@…`
   - **Forwarding Mail** — destination `support@round-table.co.uk`; **Save copies of forwarded Email** should be **checked** if James should see mail in Apple Mail / webmail

Webmail: https://apps.rackspace.com (or Launch Webmail) as **`devotional@talksfromthewarehouse.co.uk`**.

---

## DNS (verified Aug 2026)

Domain DNS is on **Squarespace / NS1**. Mail is **not** hosted there.

| Record | Value |
|--------|--------|
| MX | `mx1.emailsrvr.com` (10), `mx2.emailsrvr.com` (20) |
| SPF | `v=spf1 include:emailsrvr.com ~all` |
| DMARC | `v=DMARC1; p=none` |
| Mailchimp DKIM `k2._domainkey` | CNAME → `dkim2.mcsv.net` |
| Mailchimp DKIM `k3._domainkey` | CNAME → `dkim3.mcsv.net` |
| Mailchimp DKIM `k1._domainkey` | **Missing — add from Mailchimp domain auth UI** |

---

## Open work for Inkar

### 1. Confirm receive path (with James)

- [ ] In Cloudways → Rackspace → Forwarding: **Save copies** ON (unless James explicitly wants only Roundtable to hold mail).
- [ ] Agree who should own day-to-day `info@` replies:
  - Roundtable triage → keep forward to `support@round-table.co.uk`, **or**
  - James → forward to his preferred address (e.g. AOL / `talksfromthewarehouse@round-table.co.uk`) **and/or** keep copies in Rackspace.
- [ ] Send a test to `info@…` and confirm it appears in the agreed places (Rackspace + forward target).
- [ ] Ask James which account Apple Mail uses (`devotional@` vs something else).

### 2. Mailchimp — send as From `info@`

Receiving is fine; **sending** needs full domain authentication.

- [ ] In Mailchimp: authenticate domain `talksfromthewarehouse.co.uk`.
- [ ] Add missing **`k1._domainkey`** CNAME (and any SPF include Mailchimp shows, e.g. `include:servers.mcsv.net`, merged carefully with existing `emailsrvr.com` SPF — one SPF TXT only).
- [ ] Wait for DNS; confirm domain **Verified / Authenticated** in Mailchimp.
- [ ] Set campaign **From** to `info@talksfromthewarehouse.co.uk` (display name e.g. “Talks from the Warehouse”).
- [ ] Send a small test campaign; check spam placement.

Until `k1` is live, campaigns may send but are more likely to fail auth / land in spam.

### 3. SLJ app auth mail (separate from Mailchimp)

- Production already sends magic links **From** `Simplicity Love & Justice <info@talksfromthewarehouse.co.uk>` via **Resend** (domain verified for send). See [AuthEmailBranding.md](./AuthEmailBranding.md).
- Replies to those messages still follow the Rackspace alias → forward path above.
- Optional later: dedicated address or clearer split between marketing (Mailchimp) and app (Resend).

### 4. Optional hardening

- [ ] Create a real mailbox `info@…` (Add Mailbox) instead of alias-only, if you want a dedicated password / clearer admin UX.
- [ ] Document the final forward + save-copies policy in this file when decided.
- [ ] Tick off [Tasks.md](./Tasks.md) items for `info@` ownership once confirmed.

---

## What we already proved

- Louis’s test **“Hi James do you get this?”** (4 Aug 2026) to `info@` was accepted (no bounce). It was missing from Rackspace webmail because **forward + no save copies** emptied the mailbox view.
- Same Cloudways account historically set up the Rackspace addon for `talksfromthewarehouse.co.uk` (Dec 2023 tickets to `talksfromthewarehouse@round-table.co.uk`).

---

## Quick links

| Resource | URL |
|----------|-----|
| Cloudways | https://platform.cloudways.com/ |
| Rackspace webmail | https://apps.rackspace.com |
| SLJ production | https://slj.talksfromthewarehouse.co.uk |
| TFW site | https://talksfromthewarehouse.co.uk |
| This repo launch plan | [plans/T9-Public-Launch.md](./plans/T9-Public-Launch.md) |

---

## Message you can send Inkar

> Here’s the handoff for TFW `info@` mail (receive path, Cloudways/Rackspace, Mailchimp From auth):  
> https://github.com/louisreid/slj/blob/main/docs/InfoEmail-Mailbox.md  
>  
> Short version: `info@` is an alias to `devotional@`, which forwards to `support@round-table.co.uk`. Turn on “save copies” if James should see mail in Apple Mail. For Mailchimp From `info@`, finish domain auth — DKIM `k1` is still missing.
