import { sql } from "drizzle-orm";
import {
  COURSE_WELCOME_TAG,
  addMemberTag,
  ensureTftwSubscriber,
  memberHasTag,
} from "@/lib/mailchimp";
import { sendCourseWelcomeEmail } from "@/lib/course-welcome-email";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Course welcome only for verifications in this window (no spam on later logins). */
const FRESH_VERIFY_MS = 2 * 60 * 60 * 1000;

/**
 * After a successful course sign-in:
 * 1. Try TFTW list join (idempotent). Never resubscribes past opt-outs
 *    (unsubscribed / cleaned / archived) — James Oct 2026.
 * 2. One-time course welcome only when we actually added / already had them
 *    on the list, emailVerified is fresh (&lt;2h), and not tagged yet.
 *
 * Failures are logged and never thrown — signup must stay available if
 * Mailchimp/Resend is down.
 */
export async function onCourseSignInSideEffects(params: {
  email: string;
  name?: string | null;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  if (!email.includes("@") || email.endsWith("@example.com")) return;

  try {
    const db = getDb();
    const row = await db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${email}`,
    });
    const name = params.name ?? row?.name ?? null;

    // Join on every sign-in so users missed by the prior broken API key
    // get added when they next open the course (still respects opt-out).
    const sub = await ensureTftwSubscriber({ email, name });
    if (!sub.ok) {
      console.error("[mailchimp] ensureTftwSubscriber failed", sub.error);
      return;
    }
    // Do not claim "we've added you to TFTW" if we skipped an opt-out.
    if (sub.outcome === "skipped") return;

    const verifiedAt = row?.emailVerified;
    if (!verifiedAt) return;
    if (Date.now() - verifiedAt.getTime() > FRESH_VERIFY_MS) return;

    const alreadyWelcomed = await memberHasTag(email, COURSE_WELCOME_TAG);
    if (alreadyWelcomed) return;

    const sent = await sendCourseWelcomeEmail({ email, name });
    if (!sent.ok) {
      console.error("[course-welcome] send failed", sent.error);
      return;
    }

    await addMemberTag(email, COURSE_WELCOME_TAG);
  } catch (err) {
    console.error("[course-welcome] unexpected error", err);
  }
}
