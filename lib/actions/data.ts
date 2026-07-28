"use server";

import { auth } from "@/auth";
import {
  deleteNote,
  fetchNotesForBlocks,
  insertNote,
  updateNote,
  type Note,
} from "@/lib/notes";
import {
  getChapterProgressForUser,
  upsertChapterProgress,
  upsertProgress,
  type ChapterProgressRow,
} from "@/lib/progress";
import {
  createGroup,
  fetchGroup,
  fetchUserGroups,
  joinGroupByCode,
  updateGroupSharedNotes,
  type Group,
} from "@/lib/groups";
import { getBlockById } from "@/lib/content/loader";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Must be signed in");
  return id;
}

export async function actionFetchNotesForBlocks(
  blockIds: string[]
): Promise<Note[]> {
  const userId = await requireUserId();
  return fetchNotesForBlocks(userId, blockIds);
}

export async function actionInsertNote(
  blockId: string,
  body: string
): Promise<Note> {
  const userId = await requireUserId();
  return insertNote(userId, blockId, body);
}

export async function actionUpdateNote(
  id: string,
  body: string
): Promise<Note> {
  const userId = await requireUserId();
  return updateNote(userId, id, body);
}

export async function actionDeleteNote(id: string): Promise<void> {
  const userId = await requireUserId();
  await deleteNote(userId, id);
}

export async function actionUpsertProgress(
  sectionId: string,
  options: { last_block_id?: string; completed_at?: string } = {}
): Promise<void> {
  const userId = await requireUserId();
  await upsertProgress(userId, sectionId, options);
}

export async function actionUpsertChapterProgress(
  chapterId: string,
  options: { completed_at?: string } = {}
): Promise<void> {
  const userId = await requireUserId();
  await upsertChapterProgress(userId, chapterId, options);
}

export async function actionGetChapterProgress(): Promise<
  ChapterProgressRow[]
> {
  const userId = await requireUserId();
  return getChapterProgressForUser(userId);
}

export async function actionCreateGroup(
  name: string,
  startDate: string | null
): Promise<Group> {
  const userId = await requireUserId();
  return createGroup(userId, name, startDate);
}

export async function actionJoinGroupByCode(code: string): Promise<string> {
  const userId = await requireUserId();
  return joinGroupByCode(userId, code);
}

export async function actionFetchUserGroups(): Promise<Group[]> {
  const userId = await requireUserId();
  return fetchUserGroups(userId);
}

export async function actionFetchGroup(
  groupId: string
): Promise<Group | null> {
  const userId = await requireUserId();
  return fetchGroup(userId, groupId);
}

export async function actionUpdateGroupSharedNotes(
  groupId: string,
  sharedNotes: string
): Promise<void> {
  const userId = await requireUserId();
  await updateGroupSharedNotes(userId, groupId, sharedNotes);
}

export interface LastReadPosition {
  chapterId: string;
  blockId: string;
}

export async function getLastReadPosition(): Promise<LastReadPosition | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const { getProgressForUser } = await import("@/lib/progress");
  const rows = await getProgressForUser(userId);
  const row = rows[0];
  if (!row) return null;

  const resolved = getBlockById(row.section_id);
  if (!resolved) return null;
  const blockId = row.last_block_id ?? row.section_id;
  return { chapterId: resolved.chapterId, blockId };
}
