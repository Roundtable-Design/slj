"use client";

import type { Block, Section } from "@/lib/content";
import type { Note } from "@/lib/notes";
import { MarginNoteRow } from "@/components/MarginNoteRow";
import { BlockAnchorProvider } from "@/components/ReaderLocationContext";
import {
  BlockNode,
  isDuplicateAdjacentQuote,
  isQuoteAttributionParagraph,
  isQuoteLikeParagraph,
  ListBlock,
  QuoteWithAttribution,
  VerseBlock,
} from "@/components/BlockContent";
import { FootnoteBacklinks } from "@/components/FootnoteBacklinks";
import { parseNoteHeadingNumber } from "@/lib/content/footnotes";
import type { FootnoteCitation } from "@/lib/footnote-citations";

export interface ReaderBlockHandlers {
  isInteractive: boolean;
  chapterId?: string;
  footnoteCitations?: Map<number, FootnoteCitation[]>;
  blockIdsWithNotes: Set<string>;
  notesByBlockId: Map<string, Note[]>;
  blockIdToLabel: Record<string, string>;
  activeBlockId: string | null;
  isSignedIn: boolean;
  onAddOrEditNote: (block_id: string) => void;
  onInsert: (block_id: string, body: string) => Promise<void>;
  onUpdate: (id: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCancelComposer: () => void;
  onActivateBlock: (blockId: string) => void;
}

export function buildReaderBlockNodes(
  sections: Section[],
  handlers: ReaderBlockHandlers
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let previousBlock: Block | null = null;

  for (const section of sections) {
    const blocks = section.blocks;
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const nextBlock = blocks[i + 1] ?? null;

      if (isDuplicateAdjacentQuote(block, previousBlock)) {
        previousBlock = block;
        continue;
      }

      const quoteWithAttribution =
        block.type === "paragraph" &&
        !block.forceBody &&
        isQuoteLikeParagraph(block.content) &&
        nextBlock?.type === "paragraph" &&
        isQuoteAttributionParagraph(nextBlock.content);

      if (!handlers.isInteractive && quoteWithAttribution) {
        nodes.push(
          <QuoteWithAttribution key={block.block_id} quote={block} attribution={nextBlock!} />
        );
        previousBlock = nextBlock;
        i++;
        continue;
      }

      if (handlers.isInteractive && quoteWithAttribution) {
        const attribution = nextBlock!;
        const blockNotes = handlers.notesByBlockId.get(block.block_id) ?? [];
        const attrNotes = handlers.notesByBlockId.get(attribution.block_id) ?? [];
        const notes = [...blockNotes, ...attrNotes];
        const labelBase = handlers.blockIdToLabel[block.block_id] ?? "Quote";
        const label =
          notes.length > 1 ? `${labelBase} (${notes.length} notes)` : labelBase;
        const hasNote =
          handlers.blockIdsWithNotes.has(block.block_id) ||
          handlers.blockIdsWithNotes.has(attribution.block_id);

        nodes.push(
          <MarginNoteRow
            key={block.block_id}
            block={block}
            attributionBlock={attribution}
            notes={notes}
            label={label}
            hasNote={hasNote}
            activeBlockId={handlers.activeBlockId}
            isSignedIn={handlers.isSignedIn}
            onAddOrEditNote={handlers.onAddOrEditNote}
            onInsert={handlers.onInsert}
            onUpdate={handlers.onUpdate}
            onDelete={handlers.onDelete}
            onCancelComposer={handlers.onCancelComposer}
            onActivateBlock={handlers.onActivateBlock}
          />
        );
        previousBlock = attribution;
        i++;
        continue;
      }

      if (block.type === "list" && block.items?.length) {
        if (handlers.isInteractive) {
          nodes.push(
            <ul
              key={block.block_id}
              className="slj-bullets list-disc space-y-1 pl-6 font-serif marker:text-[var(--slj-text)]"
            >
              {block.items.map((item) => {
                const itemBlock = {
                  block_id: item.block_id,
                  type: "paragraph" as const,
                  content: item.content,
                  /** List items stay plain text even when they start with ‘ or “ */
                  forceBody: true,
                };
                const blockNotes = handlers.notesByBlockId.get(item.block_id) ?? [];
                const labelBase = handlers.blockIdToLabel[item.block_id] ?? "List item";
                const label =
                  blockNotes.length > 1
                    ? `${labelBase} (${blockNotes.length} notes)`
                    : labelBase;
                return (
                  <li key={item.block_id} id={item.block_id} className="list-item pl-1">
                    <MarginNoteRow
                      block={itemBlock}
                      notes={blockNotes}
                      label={label}
                      hasNote={handlers.blockIdsWithNotes.has(item.block_id)}
                      activeBlockId={handlers.activeBlockId}
                      isSignedIn={handlers.isSignedIn}
                      onAddOrEditNote={handlers.onAddOrEditNote}
                      onInsert={handlers.onInsert}
                      onUpdate={handlers.onUpdate}
                      onDelete={handlers.onDelete}
                      onCancelComposer={handlers.onCancelComposer}
                      onActivateBlock={handlers.onActivateBlock}
                      dense
                    />
                  </li>
                );
              })}
            </ul>
          );
        } else {
          nodes.push(<ListBlock key={block.block_id} block={block} />);
        }
        previousBlock = block;
        continue;
      }

      if (block.type === "verse" && block.lines?.length) {
        if (handlers.isInteractive) {
          const blockNotes = handlers.notesByBlockId.get(block.block_id) ?? [];
          const labelBase = handlers.blockIdToLabel[block.block_id] ?? "Song lyrics";
          const label =
            blockNotes.length > 1
              ? `${labelBase} (${blockNotes.length} notes)`
              : labelBase;
          nodes.push(
            <MarginNoteRow
              key={block.block_id}
              block={block}
              notes={blockNotes}
              label={label}
              hasNote={handlers.blockIdsWithNotes.has(block.block_id)}
              activeBlockId={handlers.activeBlockId}
              isSignedIn={handlers.isSignedIn}
              onAddOrEditNote={handlers.onAddOrEditNote}
              onInsert={handlers.onInsert}
              onUpdate={handlers.onUpdate}
              onDelete={handlers.onDelete}
              onCancelComposer={handlers.onCancelComposer}
              onActivateBlock={handlers.onActivateBlock}
            />
          );
        } else {
          nodes.push(<VerseBlock key={block.block_id} block={block} />);
        }
        previousBlock = block;
        continue;
      }

      if (
        handlers.isInteractive &&
        block.type === "paragraph" &&
        isQuoteAttributionParagraph(block.content)
      ) {
        const followsQuote =
          previousBlock?.type === "paragraph" &&
          !previousBlock.forceBody &&
          isQuoteLikeParagraph(previousBlock.content);
        if (followsQuote) {
          previousBlock = block;
          continue;
        }
        nodes.push(
          <BlockAnchorProvider key={block.block_id} blockId={block.block_id}>
            <BlockNode block={block} />
          </BlockAnchorProvider>
        );
        previousBlock = block;
        continue;
      }

      if (handlers.isInteractive && block.type === "paragraph") {
        const blockNotes = handlers.notesByBlockId.get(block.block_id) ?? [];
        const labelBase = handlers.blockIdToLabel[block.block_id] ?? "Paragraph";
        const label =
          blockNotes.length > 1
            ? `${labelBase} (${blockNotes.length} notes)`
            : labelBase;

        nodes.push(
          <MarginNoteRow
            key={block.block_id}
            block={block}
            notes={blockNotes}
            label={label}
            hasNote={handlers.blockIdsWithNotes.has(block.block_id)}
            activeBlockId={handlers.activeBlockId}
            isSignedIn={handlers.isSignedIn}
            onAddOrEditNote={handlers.onAddOrEditNote}
            onInsert={handlers.onInsert}
            onUpdate={handlers.onUpdate}
            onDelete={handlers.onDelete}
            onCancelComposer={handlers.onCancelComposer}
            onActivateBlock={handlers.onActivateBlock}
          />
        );
      } else {
        const noteNumber =
          handlers.chapterId === "29-references" &&
          previousBlock?.type === "heading"
            ? parseNoteHeadingNumber(previousBlock.content)
            : null;
        const citations =
          noteNumber != null
            ? handlers.footnoteCitations?.get(noteNumber) ?? []
            : [];

        nodes.push(
          <BlockAnchorProvider key={block.block_id} blockId={block.block_id}>
            <BlockNode block={block} />
            {citations.length > 0 ? (
              <FootnoteBacklinks citations={citations} />
            ) : null}
          </BlockAnchorProvider>
        );
      }

      previousBlock = block;
    }
  }

  return nodes;
}
