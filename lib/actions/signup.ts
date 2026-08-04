"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { emailSchema } from "@/lib/validation";

const optionalNamePartSchema = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const signUpSchema = z.object({
  email: emailSchema,
  firstName: optionalNamePartSchema,
  lastName: optionalNamePartSchema,
});

export type PrepareSignUpResult =
  | { ok: true; email: string }
  | { ok: false; error: string; code?: "account_exists" };

function displayName(
  firstName: string | undefined,
  lastName: string | undefined
): string | undefined {
  const parts = [firstName, lastName].filter(Boolean) as string[];
  if (parts.length === 0) return undefined;
  return parts.join(" ");
}

/**
 * Create Auth.js user with optional name before sending magic link.
 * Rejects emails that already belong to a verified (signed-in) account.
 * Allows re-send for unfinished sign-ups (row exists, email not verified yet).
 */
export async function prepareSignUp(input: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<PrepareSignUpResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const email = parsed.data.email.toLowerCase();
  const name = displayName(parsed.data.firstName, parsed.data.lastName);

  try {
    const db = getDb();
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      if (existing.emailVerified) {
        return {
          ok: false,
          code: "account_exists",
          error:
            "An account with this email already exists. Sign in instead.",
        };
      }
      if (name) {
        await db.update(users).set({ name }).where(eq(users.id, existing.id));
      }
      return { ok: true, email };
    }

    await db.insert(users).values({
      email,
      ...(name ? { name } : {}),
    });

    return { ok: true, email };
  } catch {
    return {
      ok: false,
      error: "We could not create your account right now. Please try again.",
    };
  }
}
