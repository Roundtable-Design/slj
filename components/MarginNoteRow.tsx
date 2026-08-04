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
   * Chapter has at least one note (or open composer). Keeps a stable two-column
   * track on desktop so text edges stay aligned across rows.
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
  const useTwoCol = reserveMargin || showMarginColumn;

  return (
    <div
      data-block-row={block.block_id}
      className={`${
        dense ? "py-0" : "py-1"
      } ${
        useTwoCol
          ? "grid grid-cols-1 items-start gap-x-0 gap-y-3 md:grid-cols-[minmax(0,65ch)_minmax(10.5rem,13rem)] md:gap-x-10 lg:grid-cols-[minmax(0,65ch)_minmax(11rem,14rem)] lg:gap-x-12"
          : "w-full"
      } ${isActive ? "rounded bg-[var(--slj-active)]" : ""}`}
    >
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
          className="margin-notes-column min-w-0 md:max-h-[50vh] md:overflow-y-auto md:pr-1"
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
      ) : useTwoCol ? (
        <div className="hidden md:block" aria-hidden />
      ) : null}
    </div>
  );
}
