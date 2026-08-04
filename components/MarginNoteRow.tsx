"use client";

import type { Block } from "@/lib/content";
import type { Note } from "@/lib/notes";
import { BlockWithNoteAction } from "@/components/BlockContent";
import { BlockAnchorProvider } from "@/components/ReaderLocationContext";
import { NoteCard } from "@/components/notes/NoteCard";
import { NewNoteComposer } from "@/components/notes/NewNoteComposer";

export interface MarginNoteRowProps {
  block: Block;
  /** Merged quote + attribution: notes use `block.block_id` only. */
  attributionBlock?: Block;
  notes: Note[];
  label: string;
  hasNote: boolean;
  activeBlockId: string | null;
  isSignedIn: boolean;
  /**
   * Chapter has at least one note (or open composer). Use the balanced
   * 1fr | 65ch | 1fr track so the measure stays centered while notes sit
   * in the right fringe.
   */
  reserveMargin?: boolean;
  onAddOrEditNote: (block_id: string) => void;
  onInsert: (block_id: string, body: string) => Promise<void>;
  onUpdate: (id: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCancelComposer: () => void;
  onActivateBlock: (blockId: string) => void;
  /** Tighter layout when the row is a bulleted list item (not a full paragraph). */
  dense?: boolean;
}

export function MarginNoteRow({
  block,
  attributionBlock,
  notes,
  label,
  hasNote,
  activeBlockId,
  isSignedIn,
  reserveMargin = false,
  onAddOrEditNote,
  onInsert,
  onUpdate,
  onDelete,
  onCancelComposer,
  onActivateBlock,
  dense = false,
}: MarginNoteRowProps) {
  const isActive =
    activeBlockId === block.block_id ||
    (attributionBlock != null && activeBlockId === attributionBlock.block_id);
  const showComposer = isSignedIn && isActive;
  const showMarginColumn = isSignedIn && (notes.length > 0 || showComposer);
  /** Balanced three-column track — text stays at the same center as no-notes. */
  const useBalancedTrack = reserveMargin || showMarginColumn;

  return (
    <div
      data-block-row={block.block_id}
      className={`${
        dense ? "py-0" : "py-1"
      } ${
        useBalancedTrack
          ? "grid w-full grid-cols-1 items-start gap-x-0 gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(0,65ch)_minmax(0,1fr)] md:gap-x-4 lg:gap-x-6"
          : "w-full"
      } ${isActive ? "rounded bg-[var(--slj-active)]" : ""}`}
    >
      {useBalancedTrack ? (
        <div className="hidden md:block" aria-hidden />
      ) : null}
      <div className="min-w-0 w-full">
        <BlockAnchorProvider blockId={block.block_id}>
          <BlockWithNoteAction
            block={block}
            attributionBlock={attributionBlock}
            hasNote={hasNote}
            onAddOrEditNote={onAddOrEditNote}
            isActive={false}
            showNoteAction={isSignedIn}
            dense={dense}
          />
        </BlockAnchorProvider>
      </div>
      {showMarginColumn ? (
        <div
          className="margin-notes-column min-w-0 md:max-h-[50vh] md:max-w-[14rem] md:overflow-y-auto md:justify-self-start md:pr-1"
          aria-label="Notes for this paragraph"
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              label={label}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isActive={note.block_id === activeBlockId}
              onActivateBlock={onActivateBlock}
            />
          ))}
          {showComposer ? (
            <NewNoteComposer
              blockId={block.block_id}
              onSave={onInsert}
              onCancel={onCancelComposer}
            />
          ) : null}
        </div>
      ) : useBalancedTrack ? (
        <div className="hidden md:block" aria-hidden />
      ) : null}
    </div>
  );
}
