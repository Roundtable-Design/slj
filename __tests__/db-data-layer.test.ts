/**
 * @jest-environment node
 *
 * Integration tests against Neon (DATABASE_URL from .env.local).
 * Skips when DATABASE_URL is unset (e.g. CI without secrets).
 */

import { config as loadEnv } from "dotenv";
import { eq } from "drizzle-orm";

loadEnv({ path: ".env.local" });

const hasDb = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);

const describeDb = hasDb ? describe : describe.skip;

describeDb("Neon data layer", () => {
  let userId: string;
  let getDb: typeof import("@/lib/db").getDb;
  let users: typeof import("@/lib/db/schema").users;
  let insertNote: typeof import("@/lib/notes").insertNote;
  let fetchNotesForBlocks: typeof import("@/lib/notes").fetchNotesForBlocks;
  let updateNote: typeof import("@/lib/notes").updateNote;
  let deleteNote: typeof import("@/lib/notes").deleteNote;
  let upsertProgress: typeof import("@/lib/progress").upsertProgress;
  let getProgressForUser: typeof import("@/lib/progress").getProgressForUser;
  let upsertChapterProgress: typeof import("@/lib/progress").upsertChapterProgress;
  let createGroup: typeof import("@/lib/groups").createGroup;
  let joinGroupByCode: typeof import("@/lib/groups").joinGroupByCode;
  let fetchGroup: typeof import("@/lib/groups").fetchGroup;
  let updateGroupSharedNotes: typeof import("@/lib/groups").updateGroupSharedNotes;

  beforeAll(async () => {
    ({ getDb } = await import("@/lib/db"));
    ({ users } = await import("@/lib/db/schema"));
    ({
      insertNote,
      fetchNotesForBlocks,
      updateNote,
      deleteNote,
    } = await import("@/lib/notes"));
    ({
      upsertProgress,
      getProgressForUser,
      upsertChapterProgress,
    } = await import("@/lib/progress"));
    ({
      createGroup,
      joinGroupByCode,
      fetchGroup,
      updateGroupSharedNotes,
    } = await import("@/lib/groups"));

    const db = getDb();
    const email = `test-${Date.now()}@example.com`;
    const [user] = await db
      .insert(users)
      .values({ email, emailVerified: new Date() })
      .returning();
    userId = user.id;
  });

  afterAll(async () => {
    if (!userId) return;
    const db = getDb();
    const { groupMembers, groups, notes, progress, chapterProgress } =
      await import("@/lib/db/schema");
    // Clean owned groups (created_by is ON DELETE RESTRICT)
    const owned = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.createdBy, userId));
    for (const g of owned) {
      await db.delete(groupMembers).where(eq(groupMembers.groupId, g.id));
      await db.delete(groups).where(eq(groups.id, g.id));
    }
    await db.delete(groupMembers).where(eq(groupMembers.userId, userId));
    await db.delete(notes).where(eq(notes.userId, userId));
    await db.delete(progress).where(eq(progress.userId, userId));
    await db.delete(chapterProgress).where(eq(chapterProgress.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  });

  test("notes CRUD is scoped to user", async () => {
    const blockId = `test-block-${Date.now()}`;
    const note = await insertNote(userId, blockId, "Hello margin");
    expect(note.body).toBe("Hello margin");
    expect(note.user_id).toBe(userId);

    const listed = await fetchNotesForBlocks(userId, [blockId]);
    expect(listed).toHaveLength(1);

    const updated = await updateNote(userId, note.id, "Updated");
    expect(updated.body).toBe("Updated");

    await deleteNote(userId, note.id);
    const after = await fetchNotesForBlocks(userId, [blockId]);
    expect(after).toHaveLength(0);
  });

  test("progress upsert works", async () => {
    const sectionId = `section-${Date.now()}`;
    await upsertProgress(userId, sectionId, { last_block_id: "b1" });
    const rows = await getProgressForUser(userId);
    expect(rows.some((r) => r.section_id === sectionId)).toBe(true);
    await upsertChapterProgress(userId, "09-session-one", {
      completed_at: new Date().toISOString(),
    });
  });

  test("groups create, join, shared notes", async () => {
    const group = await createGroup(userId, "Test Group", null);
    expect(group.invite_code).toHaveLength(8);

    const db = getDb();
    const email2 = `member-${Date.now()}@example.com`;
    const [member] = await db
      .insert(users)
      .values({ email: email2, emailVerified: new Date() })
      .returning();

    const joinedId = await joinGroupByCode(member.id, group.invite_code);
    expect(joinedId).toBe(group.id);

    await updateGroupSharedNotes(member.id, group.id, "Shared hello");
    const fetched = await fetchGroup(member.id, group.id);
    expect(fetched?.shared_notes).toBe("Shared hello");

    // Non-member cannot fetch
    const [outsider] = await db
      .insert(users)
      .values({
        email: `out-${Date.now()}@example.com`,
        emailVerified: new Date(),
      })
      .returning();
    expect(await fetchGroup(outsider.id, group.id)).toBeNull();

    await db.delete(users).where(eq(users.id, member.id));
    await db.delete(users).where(eq(users.id, outsider.id));
  });
});
