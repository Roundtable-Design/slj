"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { Note } from "@/lib/notes";
import {
  actionFetchNotesForBlocks,
  actionInsertNote,
  actionUpdateNote,
  actionDeleteNote,
  actionUpsertProgress,
  actionUpsertChapterProgress,
  actionGetChapterProgress,
} from "@/lib/actions/data";
import {
  isMissingChapterProgressTable,
  progressErrorMessage,
} from "@/lib/progress-errors";
import type { Chapter, Section } from "@/lib/content";
import { headingTextMatchesDisplayTitle } from "@/lib/content/display";
import { buildReaderBlockNodes } from "@/components/buildReaderBlocks";
import { ChapterPager } from "@/components/ChapterPager";
import { CourseChapterHrefProvider } from "@/components/ReaderLocationContext";
import {
  getSectionId,
  firstHeadingBlock,
} from "@/components/BlockContent";
import {
  consumePendingScrollRestore,
  consumeCitationScrollTarget,
  getAppScrollParent,
  loadScrollReturn,
  restoreScrollPosition,
} from "@/lib/scroll-return";
import { buildFootnoteCitationIndex } from "@/lib/footnote-citations";

const EMPTY_BLOCK_IDS: string[] = [];

export interface CourseReaderProps {
  chapterId: string;
  chapter: Chapter;
  displayTitle: string;
  sessionLabel?: string;
  sections: Section[];
  blockIds: string[];
  blockIdToLabel: Record<string, string>;
  prevChapter: { id: string; title: string } | null;
  nextChapter: { id: string; title: string } | null;
}

export function CourseReader({
  chapterId,
  chapter,
  displayTitle,
  sessionLabel,
  sections,
  blockIds,
  blockIdToLabel,
  prevChapter,
  nextChapter,
}: CourseReaderProps) {
  const isInteractive = chapter.mode !== "static";
  const effectiveBlockIds = useMemo(
    () => (isInteractive ? blockIds : EMPTY_BLOCK_IDS),
    [isInteractive, blockIds]
  );

  const { data: session } = useSession();
  const user = useMemo(
    () => (session?.user ? { id: session.user.id } : null),
    [session?.user]
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapterComplete, setChapterComplete] = useState(false);
  const [savingComplete, setSavingComplete] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [progressSetupMissing, setProgressSetupMissing] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const router = useRouter();

  const sectionIds = useMemo(
    () =>
      sections
        .map(getSectionId)
        .filter((id): id is string => id != null),
    [sections]
  );
  const blockIdToSectionId = useMemo(() => {
    const m = new Map<string, string>();
    for (const section of sections) {
      const sid = getSectionId(section);
      if (sid) {
        for (const b of section.blocks) {
          m.set(b.block_id, sid);
          if (b.type === "list" && b.items) {
            for (const item of b.items) m.set(item.block_id, sid);
          }
        }
      }
    }
    return m;
  }, [sections]);

  const skipShellHeader = useMemo(() => {
    const fb = sections[0]?.blocks[0];
    return (
      !isInteractive &&
      fb?.type === "heading" &&
      (fb.level ?? 1) === 1 &&
      headingTextMatchesDisplayTitle(fb.content, displayTitle)
    );
  }, [sections, displayTitle, isInteractive]);

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
    if (!user || effectiveBlockIds.length === 0) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await actionFetchNotesForBlocks(effectiveBlockIds);
      setNotes(data);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [user, effectiveBlockIds]);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }
    refetch();
  }, [user, refetch]);

  useEffect(() => {
    if (!isInteractive || !user || sectionIds.length === 0) return;
    let mounted = true;
    (async () => {
      try {
        const chapterProgressRows = await actionGetChapterProgress();
        if (!mounted) return;
        const chapterRow = chapterProgressRows.find(
          (r) => r.chapter_id === chapterId && r.completed_at != null
        );
        setChapterComplete(!!chapterRow);
        const firstSectionId = sectionIds[0];
        const firstBlockId = sections[0]?.blocks[0]?.block_id;
        if (firstSectionId && firstBlockId) {
          await actionUpsertProgress(firstSectionId, {
            last_block_id: firstBlockId,
          });
        }
      } catch (err) {
        if (isMissingChapterProgressTable(err)) {
          setProgressSetupMissing(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isInteractive, user, sectionIds, chapterId, sections]);

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

  const handleMarkChapterComplete = useCallback(async () => {
    if (!user || savingComplete) return;
    setSavingComplete(true);
    setCompleteError(null);
    try {
      await actionUpsertChapterProgress(chapterId, {
        completed_at: new Date().toISOString(),
      });
      setChapterComplete(true);
      router.refresh();
    } catch (err) {
      if (isMissingChapterProgressTable(err)) {
        setProgressSetupMissing(true);
        setCompleteError(null);
      } else {
        setCompleteError(progressErrorMessage(err));
      }
    } finally {
      setSavingComplete(false);
    }
  }, [user, chapterId, savingComplete, router]);

  const handleAddOrEditNote = useCallback(
    (block_id: string) => {
      if (!user) return;
      setActiveBlockId(block_id);
      const sectionId = blockIdToSectionId.get(block_id);
      if (sectionId) {
        actionUpsertProgress(sectionId, { last_block_id: block_id }).catch(
          () => {}
        );
      }
    },
    [user, blockIdToSectionId]
  );

  const handleInsertNote = useCallback(
    async (block_id: string, body: string) => {
      await actionInsertNote(block_id, body);
      const sectionId = blockIdToSectionId.get(block_id);
      if (sectionId) {
        await actionUpsertProgress(sectionId, { last_block_id: block_id });
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

  const footnoteCitations = useMemo(
    () => (chapterId === "29-references" ? buildFootnoteCitationIndex() : undefined),
    [chapterId]
  );

  const notesLayoutOpen =
    !!user && (notes.length > 0 || activeBlockId != null);

  const blockHandlers = useMemo(
    () => ({
      isInteractive,
      chapterId,
      footnoteCitations,
      blockIdsWithNotes,
      notesByBlockId,
      blockIdToLabel,
      activeBlockId,
      isSignedIn: !!user,
      reserveMargin: notesLayoutOpen,
      onAddOrEditNote: handleAddOrEditNote,
      onInsert: handleInsertNote,
      onUpdate: handleUpdateNote,
      onDelete: handleDelete,
      onCancelComposer: handleCancelComposer,
      onActivateBlock: handleActivateBlock,
    }),
    [
      isInteractive,
      chapterId,
      footnoteCitations,
      blockIdsWithNotes,
      notesByBlockId,
      blockIdToLabel,
      activeBlockId,
      user,
      notesLayoutOpen,
      handleAddOrEditNote,
      handleInsertNote,
      handleUpdateNote,
      handleDelete,
      handleCancelComposer,
      handleActivateBlock,
    ]
  );

  const renderedBlocks = useMemo(
    () => buildReaderBlockNodes(sections, blockHandlers),
    [sections, blockHandlers]
  );

  useEffect(() => {
    const scrollParent = getAppScrollParent();
    const hash = window.location.hash.slice(1);
    const citationTarget = consumeCitationScrollTarget();
    const pending = consumePendingScrollRestore();
    const saved = loadScrollReturn();

    if (pending && saved && saved.path === `/course/${chapterId}`) {
      restoreScrollPosition(scrollParent, saved.scrollTop, saved.hash || hash || undefined);
      return;
    }

    if (scrollParent) {
      scrollParent.scrollTop = 0;
    }
    const scrollTarget = citationTarget || hash;
    if (scrollTarget) {
      restoreScrollPosition(scrollParent, 0, scrollTarget);
    }
  }, [chapterId]);

  const readerColumnClass = notesLayoutOpen
    ? "slj-reader-blocks slj-reader-column--notes-open"
    : "slj-reader-blocks slj-reader-column";

  return (
    <div className="min-w-0 w-full max-w-[min(100%,90rem)]">
      {isInteractive && (
        <nav
          className="mb-8 slj-card p-5 font-sans text-sm slj-reader-column"
          aria-label="Table of contents"
        >
          <h2 className="slj-faint mb-3 font-sans text-xs uppercase tracking-[0.18em]">
            In this chapter
          </h2>
          {sessionLabel ? (
            <p className="slj-faint mb-2 font-sans text-[11px] uppercase tracking-[0.16em]">
              {sessionLabel}
            </p>
          ) : null}
          {!user ? (
            <p className="slj-muted mb-3 font-sans text-sm leading-6">
              Sign in to add private notes beside each paragraph.
            </p>
          ) : null}
          {user && (
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--slj-border)] pb-3">
              <span className="font-serif text-base font-semibold text-[var(--slj-text)]">
                {displayTitle}
              </span>
              {chapterComplete ? (
                <span className="slj-faint font-sans text-[11px] uppercase tracking-[0.16em]">
                  Complete
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkChapterComplete}
                  disabled={savingComplete}
                  className="slj-faint text-xs underline underline-offset-4 hover:text-[var(--slj-text)] disabled:opacity-50"
                >
                  {savingComplete ? "Saving…" : "Mark complete"}
                </button>
              )}
            </div>
          )}
          {progressSetupMissing ? (
            <p className="slj-muted mb-3 font-sans text-sm" role="status">
              Progress tracking is not set up on the database yet. Apply the{" "}
              <code className="text-xs">chapter_progress</code> migration via
              Neon/database migrations (see README).
            </p>
          ) : null}
          {completeError ? (
            <p className="slj-muted mb-3 font-sans text-sm" role="alert">
              {completeError}
            </p>
          ) : null}
          <ul className="space-y-1 pl-3">
            {sections.map((section) => {
              const heading = firstHeadingBlock(section);
              const sectionId = getSectionId(section);
              if (!heading || !sectionId) return null;
              return (
                <li key={heading.block_id}>
                  <Link
                    href={`#${heading.block_id}`}
                    className="slj-muted hover:text-[var(--slj-text)] hover:underline underline-offset-4"
                  >
                    {heading.content}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <article className="slj-shell overflow-x-visible p-6 font-serif md:p-8 lg:p-10">
        <ChapterPager
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          className="mb-8 border-b border-[var(--slj-border)] pb-6 slj-reader-column"
        />
        <div className={readerColumnClass}>
          {!isInteractive && !skipShellHeader ? (
            <header className="mb-8 border-b border-[var(--slj-border)] pb-4">
              <h1 className="font-serif text-4xl font-semibold leading-none text-[var(--slj-text)]">
                {displayTitle}
              </h1>
            </header>
          ) : null}
          {isInteractive && sessionLabel ? (
            <p className="slj-faint -mt-2 mb-6 font-sans text-xs uppercase tracking-[0.18em]">
              {sessionLabel}
            </p>
          ) : null}
          {isInteractive && loading ? (
            <p className="slj-muted mb-6 font-sans text-sm">Loading notes…</p>
          ) : null}
          <CourseChapterHrefProvider href={`/course/${chapterId}`}>
            {renderedBlocks}
          </CourseChapterHrefProvider>
        </div>
      </article>

      <ChapterPager
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        className="mt-8 flex justify-between border-t border-[var(--slj-border)] pt-6 slj-reader-column"
      />
    </div>
  );
}
