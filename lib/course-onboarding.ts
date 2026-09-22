import { eq } from "drizzle-orm";
import {
  COURSE_WELCOME_TAG,
  addMemberTag,
  ensureTftwSubscriber,
  memberHasTag,
} from "@/lib/mailchimp";
import { sendCourseWelcomeEmail } from "@/lib/course-welcome-email";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Only run subscribe + welcome for verifications in this window (avoids emailing existing accounts on later logins). */
const FRESH_VERIFY_MS = 2 * 60 * 60 * 1000;

/**
 * After a successful course sign-in: add to TFTW (if allowed) and send the
 * one-time course welcome that explains auto-subscribe. Failures are logged
 * and never thrown — signup must stay available if Mailchimp/Resend is down.
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
      where: eq(users.email, email),
    });
    const verifiedAt = row?.emailVerified;
    if (!verifiedAt) return;
    if (Date.now() - verifiedAt.getTime() > FRESH_VERIFY_MS) return;

    const sub = await ensureTftwSubscriber({
      email,
      name: params.name ?? row?.name,
    });
    if (!sub.ok) {
      console.error("[mailchimp] ensureTftwSubscriber failed", sub.error);
    }

    const alreadyWelcomed = await memberHasTag(email, COURSE_WELCOME_TAG);
    if (alreadyWelcomed) return;

    const sent = await sendCourseWelcomeEmail({
      email,
      name: params.name ?? row?.name,
    });
    if (!sent.ok) {
      console.error("[course-welcome] send failed", sent.error);
      return;
    }

    await addMemberTag(email, COURSE_WELCOME_TAG);
  } catch (err) {
    console.error("[course-welcome] unexpected error", err);
  }
}
