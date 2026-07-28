/**
 * Progress — server-only.
 */

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { chapterProgress, progress } from "@/lib/db/schema";
import { chapterIdSchema, sectionIdSchema } from "@/lib/validation";

export interface ProgressRow {
  id: string;
  user_id: string;
  section_id: string;
  completed_at: string | null;
  last_block_id: string | null;
  updated_at: string;
}

export interface UpsertProgressOptions {
  last_block_id?: string;
  completed_at?: string;
}

export interface ChapterProgressRow {
  id: string;
  user_id: string;
  chapter_id: string;
  completed_at: string | null;
  updated_at: string;
}

export async function upsertProgress(
  userId: string,
  section_id: string,
  options: UpsertProgressOptions = {}
): Promise<void> {
  const sectionId = sectionIdSchema.parse(section_id);
  const db = getDb();
  const now = new Date();
  const existing = await db.query.progress.findFirst({
    where: and(eq(progress.userId, userId), eq(progress.sectionId, sectionId)),
  });

  if (existing) {
    await db
      .update(progress)
      .set({
        updatedAt: now,
        ...(options.last_block_id !== undefined
          ? { lastBlockId: options.last_block_id }
          : {}),
        ...(options.completed_at !== undefined
          ? {
              completedAt: options.completed_at
                ? new Date(options.completed_at)
                : null,
            }
          : {}),
      })
      .where(eq(progress.id, existing.id));
    return;
  }

  await db.insert(progress).values({
    userId,
    sectionId,
    updatedAt: now,
    lastBlockId: options.last_block_id,
    completedAt: options.completed_at
      ? new Date(options.completed_at)
      : null,
  });
}

export async function getProgressForUser(
  userId: string
): Promise<ProgressRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(progress)
    .where(eq(progress.userId, userId))
    .orderBy(desc(progress.updatedAt));
  return rows.map((row) => ({
    id: row.id,
    user_id: row.userId,
    section_id: row.sectionId,
    completed_at: row.completedAt?.toISOString() ?? null,
    last_block_id: row.lastBlockId,
    updated_at: row.updatedAt.toISOString(),
  }));
}

export async function upsertChapterProgress(
  userId: string,
  chapter_id: string,
  options: { completed_at?: string } = {}
): Promise<void> {
  const chapterId = chapterIdSchema.parse(chapter_id);
  const db = getDb();
  const now = new Date();
  const existing = await db.query.chapterProgress.findFirst({
    where: and(
      eq(chapterProgress.userId, userId),
      eq(chapterProgress.chapterId, chapterId)
    ),
  });

  if (existing) {
    await db
      .update(chapterProgress)
      .set({
        updatedAt: now,
        ...(options.completed_at !== undefined
          ? {
              completedAt: options.completed_at
                ? new Date(options.completed_at)
                : null,
            }
          : {}),
      })
      .where(eq(chapterProgress.id, existing.id));
    return;
  }

  await db.insert(chapterProgress).values({
    userId,
    chapterId,
    updatedAt: now,
    completedAt: options.completed_at
      ? new Date(options.completed_at)
      : null,
  });
}

export async function getChapterProgressForUser(
  userId: string
): Promise<ChapterProgressRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(chapterProgress)
    .where(eq(chapterProgress.userId, userId))
    .orderBy(desc(chapterProgress.updatedAt));
  return rows.map((row) => ({
    id: row.id,
    user_id: row.userId,
    chapter_id: row.chapterId,
    completed_at: row.completedAt?.toISOString() ?? null,
    updated_at: row.updatedAt.toISOString(),
  }));
}
