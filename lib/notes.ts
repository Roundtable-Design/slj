/**
 * Private margin notes — server-only. Never log note bodies.
 */

import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { blockIdSchema, noteBodySchema } from "@/lib/validation";

export interface Note {
  id: string;
  user_id: string;
  block_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

function mapNote(row: typeof notes.$inferSelect): Note {
  return {
    id: row.id,
    user_id: row.userId,
    block_id: row.blockId,
    body: row.body,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function fetchNotesForBlocks(
  userId: string,
  blockIds: string[]
): Promise<Note[]> {
  if (blockIds.length === 0) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), inArray(notes.blockId, blockIds)))
    .orderBy(asc(notes.createdAt));
  return rows.map(mapNote);
}

export async function insertNote(
  userId: string,
  block_id: string,
  body: string
): Promise<Note> {
  const blockId = blockIdSchema.parse(block_id);
  const trimmed = noteBodySchema.parse(body);
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(notes)
    .values({
      userId,
      blockId,
      body: trimmed,
      updatedAt: now,
    })
    .returning();
  return mapNote(row);
}

export async function updateNote(
  userId: string,
  id: string,
  body: string
): Promise<Note> {
  const trimmed = noteBodySchema.parse(body);
  const db = getDb();
  const [row] = await db
    .update(notes)
    .set({ body: trimmed, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
  if (!row) throw new Error("Note not found");
  return mapNote(row);
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  const db = getDb();
  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));
}
