# T9 — Public launch plan

**Status:** Access model decided (open link from TFW). Ready to go live when Inka ships WordPress changes and email routing is confirmed.  
**Production:** https://slj.talksfromthewarehouse.co.uk  
**Parent site:** https://talksfromthewarehouse.co.uk (WordPress — Inka)

---

## Decisions (Louis + James)

| Topic | Decision |
|-------|----------|
| Entry path | Straight link from Talks from the Warehouse (no barrier / Faith-in-the-Soil style gate) |
| Announcement | Toast/banner on TFW for ~6 months, then remove (header menu stays) |
| Banner copy | **Simplicity, Love and Justice, a 10-week study course, is now digital.** |
| Nav | Add **Simplicity Love & Justice** to TFW header menu at go-live |
| Print | Clear on SLJ login/landing that a print version is available; mailto `info@talksfromthewarehouse.co.uk` |
| Auth email | Prefer sending course invites/sign-in from `info@…` so people can reply |

---

## Go-live checklist

### A. Talks from the Warehouse (Inka / WordPress)

- [ ] Add toast/banner with agreed copy → links to https://slj.talksfromthewarehouse.co.uk (or `/auth/sign-in`)
- [ ] Add header menu item: **Simplicity Love & Justice** → same URL
- [ ] Remove any “coming shortly” / taster copy for SLJ
- [ ] Keep toast for **~6 months** after go-live; leave header menu permanently

**Draft message to Inka:** see [Inka draft](#draft-message-to-inka) below — send when you are ready to flip live.

### B. SLJ app (this repo)

- [x] Print-version notice + mailto on unsigned landing and sign-in
- [ ] Confirm production deploy includes print notice
- [ ] Optional: MailChimp announcement (James copy) after TFW banner is live

### C. Email / `info@` (before or at go-live)

**Full handoff (routing, Cloudways, Mailchimp):** [`docs/InfoEmail-Mailbox.md`](../InfoEmail-Mailbox.md)

DNS today: MX → **emailsrvr.com** (Rackspace Email via Cloudways), SPF includes `emailsrvr.com`.  
`info@` is an **alias** of `devotional@`; that mailbox **forwards** to `support@round-table.co.uk` (enable **Save copies** if James should see mail in Apple Mail / webmail).

- [ ] Confirm who receives / owns day-to-day `info@` replies (Roundtable `support@` vs James) — see handoff doc
- [ ] Ensure Louis and/or James can read print-version requests and general replies
- [x] Auth.js / Resend magic links send **From** `info@talksfromthewarehouse.co.uk` (see [AuthEmailBranding.md](../AuthEmailBranding.md))
- [ ] Mailchimp: finish domain auth (`k1._domainkey` missing) before using `info@` as campaign From
- [ ] Document final reply-handling policy in InfoEmail-Mailbox.md when decided

See also [AuthEmailBranding.md](../AuthEmailBranding.md).

### D. After ~6 months

- [ ] Ask Inka to **remove the toast/banner** only; keep header menu  
  **Reminder:** TARS task `slj-tfw-toast-remove` due **2027-02-04** (six months from Aug 2026 decision)

---

## Draft message to Inka

> Hi Inka,
>
> We’re ready to announce the digital edition of Simplicity Love & Justice on Talks from the Warehouse. Could you make these WordPress updates when we give the go-live nod?
>
> **1. Toast / announcement banner** (site-wide or homepage — your call on placement that matches other TFW announcements)
> - **Text:** Simplicity, Love and Justice, a 10-week study course, is now digital.
> - **Link:** https://slj.talksfromthewarehouse.co.uk
> - Please keep this banner up for about **six months**, then we can remove it (I’ll confirm closer to the time). The menu link below should stay permanently.
>
> **2. Header menu**
> - Add an item labelled **Simplicity Love & Justice** linking to the same URL: https://slj.talksfromthewarehouse.co.uk
>
> **3. Clean-up**
> - Remove any “coming shortly” / taster wording for this course if it’s still on the site.
>
> Thanks — shout if you need copy as HTML, a preferred banner style, or a different link (e.g. straight to the sign-in page).
>
> Louis

---

## Related

- [Tasks.md](../Tasks.md) — T9 checkboxes  
- [James-Signoff-And-Maturity-Plan.md](James-Signoff-And-Maturity-Plan.md) Part 3  
- TARS: `data/memory/business/slj/` (launch thread + todos + Feb 2027 reminder)
