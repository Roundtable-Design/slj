"use server";

import { auth, signOut } from "@/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function deleteAccount(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const confirmEmail = formData.get("confirmEmail");
  if (typeof confirmEmail !== "string") {
    return { error: "Email confirmation is required." };
  }

  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return { error: "You must be signed in to delete your account." };
  }

  if (confirmEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return {
      error: "Email does not match. Type your email exactly to confirm.",
    };
  }

  const db = getDb();
  await db.delete(users).where(eq(users.id, user.id));
  await signOut({ redirect: false });
  redirect("/");
}
