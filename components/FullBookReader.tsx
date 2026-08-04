"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { Note } from "@/lib/notes";
import {
  actionFetchNotesForBlocks,
  actionInsertNote,
  actionUpdateNote,
  actionDeleteNote,
  actionUpsertProgress,
} from "@/lib/actions/data";
import type { Chapter } from "@/lib/content";
import { headingTextMatchesDisplayTitle } from "@/lib/content/display";
import { buildReaderBlockNodes } from "@/components/buildReaderBlocks";
import { CourseChapterHrefProvider } from "@/components/ReaderLocationContext";
import { getSectionId } from "@/components/BlockContent";

export interface FullBookReaderProps {
  chapters: Chapter[];
  chapterTitles: Record<string, string>;
  blockIds: string[];
  blockIdToLabel: Record<string, string>;
}

export function FullBookReader({
  chapters,
  chapterTitles,
  blockIds,
  blockIdToLabel,
}: FullBookReaderProps) {
  const { data: session } = useSession();
  const user = useMemo(
    () => (session?.user ? { id: session.user.id } : null),
    [session?.user]
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const blockIdToSectionId = useMemo(() => {
    const map = new Map<string, string>();
    for (const chapter of chapters) {
      for (const section of chapter.sections) {
        const sectionId = getSectionId(section);
        if (sectionId) {
          for (const block of section.blocks) {
            map.set(block.block_id, sectionId);
            if (block.type === "list" && block.items) {
              for (const item of block.items) {
                map.set(item.block_id, sectionId);
              }
            }
          }
        }
      }
    }
    return map;
  }, [chapters]);

  const notesByBlockId = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const note of notes) {
      const arr = map.get(note.block_id) ?? [];
      arr.push(note);
      map.set(note.block_id, arr);
    }
    return map;
  }, [notes]);

  const refetch = useCallback(async () => {
    if (!user || blockIds.length === 0) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await actionFetchNotesForBlocks(blockIds);
      setNotes(data);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [user, blockIds]);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    refetch();
  }, [user, refetch]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const element = document.getElementById(hash);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (!activeBlockId) return;
    const row = document.querySelector(
      `[data-block-row="${activeBlockId}"]`
    );
    row?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeBlockId]);

  const blockIdsWithNotes = useMemo(
    () => new Set(notes.map((n) => n.block_id)),
    [notes]
  );

  const handleAddOrEditNote = useCallback(
    (blockId: string) => {
      if (!user) return;
      setActiveBlockId(blockId);
      const sectionId = blockIdToSectionId.get(blockId);
      if (sectionId) {
        actionUpsertProgress(sectionId, { last_block_id: blockId }).catch(
          () => {}
        );
      }
    },
    [user, blockIdToSectionId]
  );

  const handleInsertNote = useCallback(
    async (blockId: string, body: string) => {
      await actionInsertNote(blockId, body);
      const sectionId = blockIdToSectionId.get(blockId);
      if (sectionId) {
        await actionUpsertProgress(sectionId, { last_block_id: blockId });
      }
      setActiveBlockId(null);
      await refetch();
    },
    [refetch, blockIdToSectionId]
  );

  const handleUpdateNote = useCallback(
    async (id: string, body: string) => {
      await actionUpdateNote(id, body);
      await refetch();
    },
    [refetch]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await actionDeleteNote(id);
      await refetch();
    },
    [refetch]
  );

  const handleCancelComposer = useCallback(() => {
    setActiveBlockId(null);
  }, []);

  const handleActivateBlock = useCallback((blockId: string) => {
    setActiveBlockId(blockId);
  }, []);

  const renderedChapters = useMemo(() => {
    return chapters.map((chapter) => {
      const displayTitle = chapterTitles[chapter.id] ?? chapter.title;
      const firstBlock = chapter.sections[0]?.blocks[0];
      const hideShellTitle =
        firstBlock?.type === "heading" &&
        (firstBlock.level ?? 1) === 1 &&
        headingTextMatchesDisplayTitle(firstBlock.content, displayTitle);

      const isInteractive = chapter.mode !== "static";
      const blockHandlers = {
        isInteractive,
        blockIdsWithNotes,
        notesByBlockId,
        blockIdToLabel,
        activeBlockId,
        isSignedIn: !!user,
        onAddOrEditNote: handleAddOrEditNote,
        onInsert: handleInsertNote,
        onUpdate: handleUpdateNote,
        onDelete: handleDelete,
        onCancelComposer: handleCancelComposer,
        onActivateBlock: handleActivateBlock,
      };

      const chapterNodes = buildReaderBlockNodes(
        chapter.sections,
        blockHandlers
      );

      return (
        <section key={chapter.id} id={chapter.id} className="mt-12 first:mt-0">
          {hideShellTitle ? null : (
            <div className="mb-6 border-b border-[var(--slj-border)] pb-4">
              <h1 className="font-serif text-4xl font-semibold leading-none text-[var(--slj-text)] md:text-5xl">
                {displayTitle}
              </h1>
            </div>
          )}
          <CourseChapterHrefProvider href={`/course/${chapter.id}`}>
            <div
              className={
                chapter.mode === "interactive"
                  ? "slj-reader-blocks slj-reader-column"
                  : "slj-reader-blocks mx-auto max-w-[72ch]"
              }
            >
              {chapterNodes}
            </div>
          </CourseChapterHrefProvider>
        </section>
      );
    });
  }, [
    chapters,
    chapterTitles,
    blockIdsWithNotes,
    notesByBlockId,
    blockIdToLabel,
    activeBlockId,
    user,
    handleAddOrEditNote,
    handleInsertNote,
    handleUpdateNote,
    handleDelete,
    handleCancelComposer,
    handleActivateBlock,
  ]);

  return (
    <div className="min-w-0 w-full max-w-[min(100%,90rem)]">
      <nav
        className="mb-8 slj-card p-5 font-sans text-sm"
        aria-label="Table of contents"
      >
        <h2 className="slj-faint mb-3 font-sans text-xs uppercase tracking-[0.18em]">
          All chapters
        </h2>
        {!user ? (
          <p className="slj-muted mb-3 font-sans text-sm leading-6">
            Sign in to add private notes beside each paragraph.
          </p>
        ) : null}
        <ul className="space-y-1">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link
                href={`#${chapter.id}`}
                className="slj-muted hover:text-[var(--slj-text)] hover:underline underline-offset-4"
              >
                {chapterTitles[chapter.id] ?? chapter.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="slj-shell p-6 font-serif md:p-10">
        {loading ? (
          <p className="slj-muted mb-6 font-sans text-sm">Loading notes…</p>
        ) : null}
        {renderedChapters}
      </article>
    </div>
  );
}
