/**
 * Groups — server-only. Membership checked in application code.
 */

import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { groupMembers, groups } from "@/lib/db/schema";
import {
  groupNameSchema,
  inviteCodeSchema,
  sharedNotesSchema,
} from "@/lib/validation";

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  start_date: string | null;
  shared_notes: string;
  created_by: string;
  created_at: string;
}

const INVITE_CODE_LENGTH = 8;
const INVITE_CODE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateInviteCode(): string {
  const bytes = new Uint8Array(INVITE_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (b) => INVITE_CODE_CHARS[b % INVITE_CODE_CHARS.length]
  ).join("");
}

function mapGroup(row: typeof groups.$inferSelect): Group {
  return {
    id: row.id,
    name: row.name,
    invite_code: row.inviteCode,
    start_date: row.startDate,
    shared_notes: row.sharedNotes,
    created_by: row.createdBy,
    created_at: row.createdAt.toISOString(),
  };
}

async function assertMember(userId: string, groupId: string): Promise<boolean> {
  const db = getDb();
  const row = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, userId)
    ),
  });
  return !!row;
}

export async function createGroup(
  userId: string,
  name: string,
  start_date: string | null
): Promise<Group> {
  const trimmedName = groupNameSchema.parse(name);
  const dateValue =
    start_date && start_date.trim() ? start_date.trim() : null;
  const db = getDb();

  for (let attempt = 0; attempt < 3; attempt++) {
    const inviteCode = generateInviteCode();
    try {
      const [group] = await db
        .insert(groups)
        .values({
          name: trimmedName,
          inviteCode,
          startDate: dateValue,
          sharedNotes: "",
          createdBy: userId,
        })
        .returning();

      await db.insert(groupMembers).values({
        groupId: group.id,
        userId,
        role: "owner",
      });

      return mapGroup(group);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("unique") && attempt < 2) continue;
      throw err;
    }
  }

  throw new Error("Could not generate unique invite code");
}

export async function joinGroupByCode(
  userId: string,
  code: string
): Promise<string> {
  const trimmed = inviteCodeSchema.parse(code);
  const db = getDb();
  const group = await db.query.groups.findFirst({
    where: eq(groups.inviteCode, trimmed),
  });
  if (!group) throw new Error("Invalid or expired invite code");

  await db
    .insert(groupMembers)
    .values({
      groupId: group.id,
      userId,
      role: "member",
    })
    .onConflictDoNothing();

  return group.id;
}

export async function fetchUserGroups(userId: string): Promise<Group[]> {
  const db = getDb();
  const memberships = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));
  if (!memberships.length) return [];

  const groupIds = memberships.map((m) => m.groupId);
  const rows = await db
    .select()
    .from(groups)
    .where(inArray(groups.id, groupIds))
    .orderBy(asc(groups.name));
  return rows.map(mapGroup);
}

export async function fetchGroup(
  userId: string,
  groupId: string
): Promise<Group | null> {
  if (!(await assertMember(userId, groupId))) return null;
  const db = getDb();
  const row = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
  });
  return row ? mapGroup(row) : null;
}

export async function updateGroupSharedNotes(
  userId: string,
  groupId: string,
  shared_notes: string
): Promise<void> {
  if (!(await assertMember(userId, groupId))) {
    throw new Error("Not a group member");
  }
  const trimmed = sharedNotesSchema.parse(shared_notes);
  const db = getDb();
  await db
    .update(groups)
    .set({ sharedNotes: trimmed })
    .where(eq(groups.id, groupId));
}
