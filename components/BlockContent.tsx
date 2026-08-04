"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { MessageSquare } from "lucide-react";
import { renderContentWithWorksheetCallouts } from "@/components/WorksheetPrintLink";
import { paragraphContainsWorksheetLink } from "@/lib/worksheet-links";
import type { Block, Section } from "@/lib/content";
import {
  INLINE_FOOTNOTE_RE,
  noteChapterHref,
  parseNoteHeadingNumber,
} from "@/lib/content/footnotes";
import {
  saveFootnoteScrollReturn,
  resolveFootnoteAnchorBlockId,
} from "@/lib/scroll-return";
import { SCRIPTURE_CITATION_TAIL_RE, SCRIPTURE_REF } from "@/lib/content/scripture";

const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

export function getSectionId(section: Section): string | undefined {
  return section.blocks[0]?.block_id;
}

export function firstHeadingBlock(section: Section): Block | undefined {
  return section.blocks.find((b) => b.type === "heading");
}

const SCRIPTURE_REF_REGEX = new RegExp(
  `(?:^|\\(|\\s)(${SCRIPTURE_REF.source})(?:\\)|[.,”'"])`,
  "u"
);

function normalizeParagraphForCompare(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[“”‘’'"`]/g, "");
}

export function isQuoteLikeParagraph(content: string): boolean {
  const trimmed = content.trim();
  return /^([>"“”‘’']|\u2014)/u.test(trimmed);
}

/** Line after a quote: em dash or hyphen + short attribution (not a discussion bullet). */
export function isQuoteAttributionParagraph(content: string): boolean {
  const trimmed = content.trim();
  if (/^—\s+\S/u.test(trimmed)) return true;
  if (/^-\s+\S/u.test(trimmed)) {
    if (trimmed.length > 160 || /\?\s*$/u.test(trimmed)) return false;
    return true;
  }
  return false;
}

export function formatQuoteAttribution(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("—")) return trimmed;
  if (trimmed.startsWith("-")) return `—${trimmed.slice(1)}`;
  return `— ${trimmed}`;
}

export function isScriptureParagraph(content: string): boolean {
  return SCRIPTURE_REF_REGEX.test(content.trim());
}

export function parseBibleQuoteContent(
  content: string
): { quoteText: string; reference: string } | null {
  const trimmed = content.trim();
  if (!isQuoteLikeParagraph(trimmed)) return null;
  const match = trimmed.match(SCRIPTURE_CITATION_TAIL_RE);
  if (!match) return null;
  const reference = match[1].trim();
  const quoteText = trimmed.slice(0, match.index).trim();
  if (!quoteText || !SCRIPTURE_REF_REGEX.test(`(${reference})`)) return null;
  return { quoteText, reference };
}

export function isBibleQuoteParagraph(content: string): boolean {
  if (parseBibleQuoteContent(content)) return true;
  return isQuoteLikeParagraph(content) && isScriptureParagraph(content);
}

function getScriptureFigureProps(block: Block): {
  isBible: boolean;
  quoteText: string;
  reference: string | null;
} {
  if (block.scriptureRef) {
    return {
      isBible: true,
      quoteText: block.content,
      reference: block.scriptureRef,
    };
  }
  const parsed = parseBibleQuoteContent(block.content);
  if (parsed) {
    return {
      isBible: true,
      quoteText: parsed.quoteText,
      reference: parsed.reference,
    };
  }
  if (block.forceScripture || isBibleQuoteParagraph(block.content)) {
    return { isBible: true, quoteText: block.content, reference: null };
  }
  return { isBible: false, quoteText: block.content, reference: null };
}

function shouldRenderAsQuoteFigure(block: Block): boolean {
  if (block.forceBody || block.headlineQuote) return false;
  if (block.scriptureRef || block.forceScripture) return true;
  return isQuoteLikeParagraph(block.content);
}

export function isDuplicateAdjacentQuote(current: Block, previous: Block | null): boolean {
  if (!previous) return false;
  if (current.type !== "paragraph" || previous.type !== "paragraph") return false;
  if (!isQuoteLikeParagraph(current.content) || !isQuoteLikeParagraph(previous.content)) return false;
  return normalizeParagraphForCompare(current.content) === normalizeParagraphForCompare(previous.content);
}

function isFurtherReadingHeading(content: string): boolean {
  return /^further reading\b/i.test(content.trim());
}

function renderTextWithFootnotes(text: string, keyStart: number): { nodes: React.ReactNode[]; nextKey: number } {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = keyStart;
  const re = new RegExp(INLINE_FOOTNOTE_RE.source, INLINE_FOOTNOTE_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    const noteNumber = Number.parseInt(m[1], 10);
    nodes.push(
      <Link
        key={`fn-${key++}`}
        href={noteChapterHref(noteNumber)}
        onClick={(e) => {
          saveFootnoteScrollReturn(resolveFootnoteAnchorBlockId(e.currentTarget));
        }}
        className="underline decoration-1 underline-offset-[0.15em] hover:text-[var(--slj-text-muted)]"
      >
        [{noteNumber}]
      </Link>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return { nodes, nextKey: key };
}

/** Minimal inline markdown: `[label](href)`, `[](print-url)` icon, `*italic*`, `_italic_`, footnote `[n]`. */
function renderInlineMarkdown(text: string): ReactNode {
  const re = /\[([^\]]*)\]\(([^)\s]+)\)|\*([^*]+)\*|_([^_]+)_/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      const segment = text.slice(last, m.index);
      const footnoted = renderTextWithFootnotes(segment, key);
      out.push(...footnoted.nodes);
      key = footnoted.nextKey;
    }
    if (m[1] != null && m[2] != null) {
      out.push(
        <Link
          key={`md-${key++}`}
          href={m[2]}
          className="underline decoration-1 underline-offset-[0.15em] hover:text-[var(--slj-text-muted)]"
        >
          {m[1]}
        </Link>
      );
    } else {
      const emphasis = m[3] ?? m[4];
      out.push(
        <em key={`md-${key++}`} className="italic">
          {emphasis}
        </em>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    const footnoted = renderTextWithFootnotes(text.slice(last), key);
    out.push(...footnoted.nodes);
    key = footnoted.nextKey;
  }
  return out.length === 0 ? text : <Fragment>{out}</Fragment>;
}

const PULL_QUOTE_BODY =
  "font-serif text-[17px] italic leading-[1.75] text-[var(--slj-text)] md:text-[18px]";
const SCRIPTURE_QUOTE_BODY =
  "font-serif text-[18px] font-semibold not-italic leading-[1.72] text-[var(--slj-text)] md:text-[19px]";

function QuoteFigure({ quote, attribution }: { quote: Block; attribution?: Block }) {
  const { isBible, quoteText, reference } = getScriptureFigureProps(quote);

  return (
    <figure
      className={
        isBible
          ? "slj-scripture-quote border-l-[5px] border-[var(--slj-text)] bg-[var(--slj-hover)] pl-5 pr-3 py-1"
          : "slj-pull-quote border-l-4 border-[var(--slj-border)] pl-5 pr-2"
      }
      data-block-id={quote.block_id}
      id={quote.block_id}
    >
      <blockquote className="m-0 border-0 p-0">
        <p className={isBible ? SCRIPTURE_QUOTE_BODY : PULL_QUOTE_BODY}>
          {renderInlineMarkdown(quoteText)}
        </p>
      </blockquote>
      {reference ? (
        <figcaption className="mt-3 border-t border-[var(--slj-border)] pt-2">
          <span className="slj-faint block font-sans text-[10px] font-medium uppercase tracking-[0.2em]">
            Scripture
          </span>
          <cite className="mt-1 block font-sans text-[13px] font-medium not-italic text-[var(--slj-text-muted)]">
            {reference}
          </cite>
        </figcaption>
      ) : null}
      {attribution && !reference ? (
        <figcaption
          className="slj-faint mt-2 font-sans text-[13px] font-medium tracking-wide"
          data-block-id={attribution.block_id}
          id={attribution.block_id}
        >
          {formatQuoteAttribution(attribution.content)}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function QuoteWithAttribution({
  quote,
  attribution,
}: {
  quote: Block;
  attribution: Block;
}) {
  return <QuoteFigure quote={quote} attribution={attribution} />;
}

function ListItemContent({ content }: { content: string }) {
  return renderContentWithWorksheetCallouts(content, (prose) => (
    <span className="font-serif text-[18px] font-medium leading-[1.72] text-[var(--slj-text)] md:text-[19px]">
      {renderInlineMarkdown(prose)}
    </span>
  ));
}

export function ListBlock({ block }: { block: Block }) {
  if (block.type !== "list" || !block.items?.length) return null;
  return (
    <ul
      className="slj-bullets list-disc space-y-1 pl-6 font-serif marker:text-[var(--slj-text)]"
      data-block-id={block.block_id}
    >
      {block.items.map((item) => (
        <li
          key={item.block_id}
          id={item.block_id}
          data-block-id={item.block_id}
          className="pl-1 leading-[1.72] text-[var(--slj-text)]"
        >
          <ListItemContent content={item.content} />
        </li>
      ))}
    </ul>
  );
}

/** Multi-line poetry or lyrics (`>>` right column, `::` centered). */
export function VerseBlock({ block }: { block: Block }) {
  if (block.type !== "verse" || !block.lines?.length) return null;
  const centered = block.verseAlign === "center";
  return (
    <div
      className={
        centered
          ? "mx-auto max-w-[36rem] text-center font-serif text-[15px] leading-[1.38] text-[var(--slj-text)] md:text-[16px]"
          : "ml-auto max-w-[28rem] text-right font-serif text-[15px] leading-[1.38] text-[var(--slj-text)] md:text-[16px]"
      }
      data-block-id={block.block_id}
      id={block.block_id}
    >
      {block.lines.map((line, index) =>
        line.content === "" ? (
          <div key={`gap-${index}`} className="h-3" aria-hidden="true" />
        ) : (
          <div key={line.block_id || `${index}-${line.content}`}>
            {renderInlineMarkdown(line.content)}
          </div>
        )
      )}
    </div>
  );
}

export function BlockNode({ block }: { block: Block }) {
  if (block.type === "heading") {
    const level = Math.min(Math.max(block.level ?? 1, 1), 6);
    const further = isFurtherReadingHeading(block.content);
    const noteNumber = parseNoteHeadingNumber(block.content);
    const headingId = noteNumber != null ? `note-${noteNumber}` : block.block_id;
    const headingClassName =
      noteNumber != null
        ? "mt-8 font-serif text-[18px] font-medium leading-[1.72] text-[var(--slj-text)] first:mt-0 md:text-[19px]"
        : level <= 1
          ? "mt-10 text-4xl font-semibold leading-tight first:mt-0 md:text-5xl"
          : level === 2
            ? further
              ? "mt-12 border-t border-[var(--slj-border)] pt-8 text-3xl font-semibold leading-tight first:mt-0"
              : "mt-10 text-3xl font-semibold leading-tight first:mt-0"
            : "mt-8 text-2xl font-semibold leading-tight first:mt-0";

    const Tag = noteNumber != null ? "p" : HEADING_TAGS[level - 1];

    return (
      <Tag
        className={`font-serif text-[var(--slj-text)] ${headingClassName}`}
        data-block-id={block.block_id}
        id={headingId}
      >
        {block.content}
      </Tag>
    );
  }
  if (block.type === "list") {
    return <ListBlock block={block} />;
  }
  if (block.type === "verse") {
    return <VerseBlock block={block} />;
  }
  if (block.type === "paragraph") {
    if (block.headlineQuote) {
      return (
        <p
          className="py-5 text-center font-serif text-[22px] font-semibold leading-[1.45] text-[var(--slj-text)] md:text-[24px]"
          data-block-id={block.block_id}
          id={block.block_id}
        >
          {renderInlineMarkdown(block.content)}
        </p>
      );
    }
    if (isQuoteAttributionParagraph(block.content)) {
      return (
        <p
          className="slj-faint -mt-1 mb-0 border-l-4 border-transparent pl-5 font-sans text-[13px] font-medium tracking-wide text-[var(--slj-text-muted)]"
          data-block-id={block.block_id}
          id={block.block_id}
        >
          {formatQuoteAttribution(block.content)}
        </p>
      );
    }
    if (shouldRenderAsQuoteFigure(block)) {
      return <QuoteFigure quote={block} />;
    }

    if (paragraphContainsWorksheetLink(block.content)) {
      return (
        <div
          className="font-serif text-[18px] font-medium leading-[1.72] text-[var(--slj-text)] md:text-[19px]"
          data-block-id={block.block_id}
          id={block.block_id}
        >
          {renderContentWithWorksheetCallouts(block.content, (prose) => (
            <p className="m-0">{renderInlineMarkdown(prose)}</p>
          ))}
        </div>
      );
    }

    return (
      <p
        className="font-serif text-[18px] font-medium leading-[1.72] text-[var(--slj-text)] md:text-[19px]"
        data-block-id={block.block_id}
        id={block.block_id}
      >
        {renderInlineMarkdown(block.content)}
      </p>
    );
  }
  return null;
}

export function BlockWithNoteAction({
  block,
  attributionBlock,
  hasNote,
  onAddOrEditNote,
  isActive,
  showNoteAction = true,
  dense = false,
}: {
  block: Block;
  /** When set, notes anchor to `block` (the quote) and the figure includes the attribution. */
  attributionBlock?: Block;
  hasNote: boolean;
  onAddOrEditNote: (block_id: string) => void;
  isActive?: boolean;
  showNoteAction?: boolean;
  dense?: boolean;
}) {
  if (!showNoteAction) {
    return attributionBlock ? (
      <QuoteFigure quote={block} attribution={attributionBlock} />
    ) : (
      <BlockNode block={block} />
    );
  }

  const blockContent = attributionBlock ? (
    <QuoteFigure quote={block} attribution={attributionBlock} />
  ) : (
    <BlockNode block={block} />
  );

  return (
    <div
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onAddOrEditNote(block.block_id);
        }
      }}
      className={`group/block relative rounded transition-colors ${
        dense ? "py-0" : "py-1"
      } ${
        isActive ? "bg-[var(--slj-active)]" : "hover:bg-[var(--slj-hover)] focus-within:bg-[var(--slj-hover)]"
      }`}
    >
      {/*
        Keep the reading measure full-width (same as static chapters).
        The note control sits just past the text edge — never shrinks the column.
      */}
      <div className="min-w-0 w-full">{blockContent}</div>
      <button
        type="button"
        onClick={() => onAddOrEditNote(block.block_id)}
        className={`absolute z-10 flex items-center justify-center rounded border border-transparent bg-[var(--slj-surface)] text-[var(--slj-text-muted)] transition-colors hover:border-[var(--slj-border)] hover:text-[var(--slj-text)] focus-visible:border-[var(--slj-border)] focus-visible:text-[var(--slj-text)] 2xl:left-full 2xl:right-auto 2xl:ml-2 2xl:opacity-0 2xl:group-hover/block:opacity-100 2xl:group-focus-within/block:opacity-100 ${
          dense
            ? "right-0 top-0.5 h-8 w-8"
            : "right-0 top-1/2 h-9 w-9 -translate-y-1/2"
        }`}
        aria-label={hasNote ? "Edit note" : "Add note for this paragraph"}
      >
        <MessageSquare size={16} strokeWidth={2.1} />
      </button>
    </div>
  );
}
