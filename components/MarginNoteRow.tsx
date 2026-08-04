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
   * @deprecated Layout no longer reserves a second track; kept for call-site compat.
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

  return (
    <div
      data-block-row={block.block_id}
      className={`relative w-full ${dense ? "py-0" : "py-1"} ${
        isActive ? "rounded bg-[var(--slj-active)]" : ""
      }`}
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
          className="margin-notes-column mt-3 min-w-0 2xl:absolute 2xl:left-full 2xl:top-0 2xl:mt-0 2xl:ml-6 2xl:w-[14rem] 2xl:max-h-[50vh] 2xl:overflow-y-auto"
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
      ) : null}
    </div>
  );
}
