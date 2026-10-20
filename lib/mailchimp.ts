import { createHash } from "crypto";

/** Trim — Vercel env paste sometimes stores trailing newlines that break Basic auth. */
const AUDIENCE_ID = (process.env.MAILCHIMP_AUDIENCE_ID ?? "").trim();
const API_KEY = (process.env.MAILCHIMP_API_KEY ?? "").trim();

/** Account + list unsubscribe (audience-wide). */
export const TFTW_UNSUBSCRIBE_URL =
  (process.env.MAILCHIMP_UNSUBSCRIBE_URL ?? "").trim() ||
  "https://talksfromthewarehouse.us21.list-manage.com/unsubscribe?u=1c8d690688ecca6278d4b78e4&id=d25a712438";

type MemberStatus =
  | "subscribed"
  | "unsubscribed"
  | "cleaned"
  | "pending"
  | "transactional"
  | "archived";

export type EnsureTftwResult =
  | {
      ok: true;
      outcome: "added" | "already_subscribed" | "skipped";
    }
  | { ok: false; error: string };

/** Pure decision for tests / audit — never force-resubscribe existing opt-outs. */
export function decideTftwSubscribeAction(params: {
  httpStatus: number;
  memberStatus?: string | null;
}): "already_subscribed" | "skipped" | "add_new" | "error" {
  if (params.httpStatus === 404) return "add_new";
  if (params.httpStatus < 200 || params.httpStatus >= 300) return "error";
  const status = (params.memberStatus ?? "").toLowerCase();
  if (status === "subscribed" || status === "pending") {
    return "already_subscribed";
  }
  // unsubscribed / cleaned / archived / transactional / unknown — leave alone
  return "skipped";
}

function datacenter(): string | null {
  if (!API_KEY.includes("-")) return null;
  return API_KEY.split("-").pop() ?? null;
}

function subscriberHash(email: string): string {
  return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

function configured(): boolean {
  return Boolean(API_KEY && AUDIENCE_ID && datacenter());
}

async function mcFetch(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const dc = datacenter();
  if (!dc || !API_KEY) {
    return { ok: false, status: 0, json: { detail: "Mailchimp not configured" } };
  }
  const res = await fetch(`https://${dc}.api.mailchimp.com/3.0${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`any:${API_KEY}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json };
}

/**
 * Ensure email is on the TFTW audience. Idempotent; does not block callers on failure.
 *
 * James (Oct 2026): do not auto-resubscribe anyone who previously opted out
 * (unsubscribed / cleaned / archived). Only brand-new addresses (HTTP 404) are added.
 * Never sends Mailchimp `status: "subscribed"` for an existing member — that field
 * force-resubscribes opt-outs.
 */
export async function ensureTftwSubscriber(params: {
  email: string;
  name?: string | null;
}): Promise<EnsureTftwResult> {
  if (!configured()) {
    return { ok: false, error: "Mailchimp env not configured" };
  }

  const email = params.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Invalid email" };
  }

  const hash = subscriberHash(email);
  const existing = await mcFetch(`/lists/${AUDIENCE_ID}/members/${hash}`);
  const memberStatus = (existing.json as { status?: MemberStatus })?.status;
  const action = decideTftwSubscribeAction({
    httpStatus: existing.status,
    memberStatus,
  });

  if (action === "already_subscribed") {
    return { ok: true, outcome: "already_subscribed" };
  }
  if (action === "skipped") {
    return { ok: true, outcome: "skipped" };
  }
  if (action === "error") {
    const detail =
      (existing.json as { detail?: string })?.detail ??
      `HTTP ${existing.status}`;
    return { ok: false, error: detail };
  }

  const [firstName, ...rest] = (params.name ?? "").trim().split(/\s+/);
  const lastName = rest.join(" ");
  const merge_fields: Record<string, string> = {};
  if (firstName) merge_fields.FNAME = firstName;
  if (lastName) merge_fields.LNAME = lastName;

  // New contacts only: status_if_new applies when the address is absent.
  // Do NOT set `status` — that would overwrite an existing opt-out if the
  // member appeared between GET and PUT.
  const body = {
    email_address: email,
    status_if_new: "subscribed" as const,
    ...(Object.keys(merge_fields).length ? { merge_fields } : {}),
  };

  const put = await mcFetch(`/lists/${AUDIENCE_ID}/members/${hash}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!put.ok) {
    const detail =
      (put.json as { detail?: string })?.detail ?? `HTTP ${put.status}`;
    // Compliance / already-unsubscribed responses → treat as skipped, not failure
    const lower = detail.toLowerCase();
    if (
      lower.includes("compliance") ||
      lower.includes("unsubscribed") ||
      lower.includes("cleaned")
    ) {
      return { ok: true, outcome: "skipped" };
    }
    return { ok: false, error: detail };
  }

  const putStatus = (put.json as { status?: MemberStatus })?.status;
  if (putStatus === "unsubscribed" || putStatus === "cleaned") {
    return { ok: true, outcome: "skipped" };
  }

  return { ok: true, outcome: "added" };
}

/** Tag used so we only send the course welcome email once. */
export const COURSE_WELCOME_TAG = "course-welcome-sent";

export async function memberHasTag(
  email: string,
  tagName: string
): Promise<boolean> {
  if (!configured()) return false;
  const hash = subscriberHash(email.trim().toLowerCase());
  const res = await mcFetch(
    `/lists/${AUDIENCE_ID}/members/${hash}/tags?count=100`
  );
  if (!res.ok) return false;
  const tags = (res.json as { tags?: { name: string }[] })?.tags ?? [];
  return tags.some((t) => t.name === tagName);
}

export async function addMemberTag(
  email: string,
  tagName: string
): Promise<void> {
  if (!configured()) return;
  const hash = subscriberHash(email.trim().toLowerCase());
  await mcFetch(`/lists/${AUDIENCE_ID}/members/${hash}/tags`, {
    method: "POST",
    body: JSON.stringify({
      tags: [{ name: tagName, status: "active" }],
    }),
  });
}
