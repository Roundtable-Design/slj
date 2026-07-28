import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import {
  getChapterDisplayTitleMap,
  getChapters,
  getFirstInteractiveChapter,
  getResumeHref,
  getSections,
} from "@/lib/content";
import { getLastReadPosition } from "@/lib/actions/data";
import { getChapterProgressForUser } from "@/lib/progress";
import {
  getChapterCompletionStats,
  getInteractiveSessionNumberMap,
} from "@/lib/progress-summary";
import { formatSessionLabel } from "@/lib/session-labels";
import { PageShell } from "@/components/ui/surfaces";
import { COURSE_TITLE, PREFACE_HREF } from "@/lib/site-branding";
import type { Chapter, Section } from "@/lib/content";

const FRONT_MATTER_CHAPTER_IDS = new Set([
  "04-preface",
  "05-reviews",
  "06-foreword-summer-2004",
  "07-introduction",
]);

function getSectionId(section: Section): string | undefined {
  return section.blocks[0]?.block_id;
}

function firstHeadingContent(section: Section): string {
  const heading = section.blocks.find((b) => b.type === "heading");
  return heading?.content ?? "Section";
}

export type ProgressDashboardVariant = "home" | "progress";

export interface ProgressDashboardProps {
  /** home: flat curriculum list; progress: front matter + sessions grouping */
  variant?: ProgressDashboardVariant;
}

export async function ProgressDashboard({
  variant = "home",
}: ProgressDashboardProps = {}) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  let progressSetupMissing = false;
  const completedByChapter = new Map<string, boolean>();
  try {
    const chapterProgressRows = await getChapterProgressForUser(user.id);
    for (const row of chapterProgressRows) {
      if (row.completed_at != null) {
        completedByChapter.set(row.chapter_id, true);
      }
    }
  } catch {
    progressSetupMissing = true;
  }

  const lastRead = await getLastReadPosition();
  const chapters = getChapters();
  const chapterTitles = getChapterDisplayTitleMap(chapters);
  const continueHref = getResumeHref(chapters, lastRead);

  const { total: totalChapters, completed: completedChapters, percent } =
    getChapterCompletionStats(chapters, completedByChapter);

  const nextChapterForResume = lastRead
    ? chapters.find((ch) => ch.id === lastRead.chapterId)
    : getFirstInteractiveChapter(chapters);
  const nextMilestoneLabel = nextChapterForResume
    ? chapterTitles.get(nextChapterForResume.id) ?? nextChapterForResume.title
    : "Start course";

  const frontMatterChapters =
    variant === "progress"
      ? chapters.filter((chapter) => FRONT_MATTER_CHAPTER_IDS.has(chapter.id))
      : [];
  const sessionChapters =
    variant === "progress"
      ? chapters.filter((chapter) => !FRONT_MATTER_CHAPTER_IDS.has(chapter.id))
      : chapters;

  const curriculumSubtitle =
    variant === "progress" ? "Session index" : "All chapters";

  const sessionNumberByChapterId = getInteractiveSessionNumberMap(chapters);

  const renderChapterLink = (chapter: Chapter, rich: boolean) => {
    const sections = getSections(chapter);
    const sectionCount = sections.filter((s) => getSectionId(s)).length;
    const chapterCompleted = completedByChapter.get(chapter.id);
    const isCurrent = lastRead?.chapterId === chapter.id && !chapterCompleted;
    const displayTitle = chapterTitles.get(chapter.id) ?? chapter.title;
    const firstHeading =
      sections.length > 0 ? firstHeadingContent(sections[0]) : "";
    const isStatic = chapter.mode === "static";
    const sessionNumber = sessionNumberByChapterId.get(chapter.id);

    return (
      <Link
        key={chapter.id}
        href={`/course/${chapter.id}`}
        className={`group flex items-start border p-5 transition-colors ${
          isStatic ? "gap-0" : "gap-4"
        } ${
          isCurrent
            ? "border-[var(--slj-text)] bg-[var(--slj-hover)]"
            : "border-[var(--slj-border)] bg-[var(--slj-surface)] hover:bg-[var(--slj-hover)]"
        }`}
      >
        {sessionNumber != null ? (
          <div className="mt-0.5 shrink-0" aria-hidden>
            {chapterCompleted ? (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--slj-button-bg)] bg-[var(--slj-button-bg)] font-sans text-xs font-medium tabular-nums text-[var(--slj-button-fg)]"
                title="Completed"
              >
                {sessionNumber}
              </div>
            ) : isCurrent ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--slj-text)] font-sans text-xs font-medium tabular-nums text-[var(--slj-text)]">
                {sessionNumber}
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--slj-border)] font-sans text-xs font-medium tabular-nums slj-faint">
                {sessionNumber}
              </div>
            )}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {rich ? (
                <>
                  {sessionNumber != null ? (
                    <p className="slj-faint mb-1 font-sans text-[11px] uppercase tracking-[0.16em]">
                      {formatSessionLabel(sessionNumber)}
                    </p>
                  ) : null}
                  <h3 className="font-serif text-2xl leading-tight text-[var(--slj-text)]">
                    {displayTitle}
                  </h3>
                  <p className="slj-muted mt-2 max-w-xl font-sans text-sm leading-6">
                    {firstHeading || displayTitle}
                  </p>
                </>
              ) : (
                <>
                  {sessionNumber != null ? (
                    <p className="slj-faint mb-1 font-sans text-[10px] uppercase tracking-[0.14em]">
                      {formatSessionLabel(sessionNumber)}
                    </p>
                  ) : null}
                  <div className="font-serif text-xl text-[var(--slj-text)]">
                    {displayTitle}
                  </div>
                  {firstHeading ? (
                    <div className="slj-muted mt-1 font-sans text-sm">
                      {firstHeading}
                    </div>
                  ) : null}
                </>
              )}
            </div>
            {rich && chapterCompleted ? (
              <span className="slj-faint font-sans text-[11px] uppercase tracking-[0.16em]">
                Completed
              </span>
            ) : rich && isCurrent ? (
              <span className="slj-faint font-sans text-[11px] uppercase tracking-[0.16em]">
                Current
              </span>
            ) : null}
          </div>
          {chapter.mode !== "static" && (
            <div className="slj-faint mt-4 flex items-center gap-4 font-sans text-[11px] uppercase tracking-[0.16em]">
              <span>{sectionCount} sections</span>
            </div>
          )}
        </div>
        <div className="slj-faint hidden shrink-0 self-center transition-colors group-hover:text-[var(--slj-text)] md:block">
          <ArrowRight size={18} strokeWidth={2} />
        </div>
      </Link>
    );
  };

  const richCards = variant === "progress";

  return (
    <PageShell className="mx-auto max-w-5xl">
      {progressSetupMissing ? (
        <p
          className="slj-muted mb-8 border border-[var(--slj-border)] bg-[var(--slj-surface)] p-4 font-sans text-sm"
          role="status"
        >
          Chapter completion is not available until the{" "}
          <code className="text-xs">chapter_progress</code> migration is applied
          on the database. Run <code className="text-xs">pnpm db:migrate</code> (see
          README).
        </p>
      ) : null}

      <section className="mb-12 border-b border-[var(--slj-border)] pb-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="slj-faint font-sans text-xs uppercase tracking-[0.18em]">
              Progress
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-none text-[var(--slj-text)] md:text-5xl">
              {COURSE_TITLE}
            </h1>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-serif text-5xl leading-none text-[var(--slj-text)]">
              {percent}%
            </span>
            <span className="slj-faint pb-1 font-sans text-xs uppercase tracking-[0.18em]">
              Complete
            </span>
          </div>
        </div>
        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-[var(--slj-hover)]">
          <div
            className="h-full rounded-full bg-[var(--slj-text)] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="slj-card p-6">
            <div>
              <h2 className="slj-faint font-sans text-xs uppercase tracking-[0.18em]">
                Continue
              </h2>
              <p className="mt-3 font-serif text-2xl leading-tight text-[var(--slj-text)]">
                {nextMilestoneLabel}
              </p>
              <p className="slj-muted mt-2 font-sans text-sm leading-6">
                Return to your last place in the course, or begin at the first
                session if you have not started yet.
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <Link
                href={continueHref}
                className="slj-button inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm"
              >
                <span>Continue</span>
                <Play size={16} strokeWidth={2.25} />
              </Link>
              <Link
                href={PREFACE_HREF}
                className="slj-button-secondary inline-flex w-full items-center justify-center px-4 py-3 text-sm"
              >
                Start at Preface
              </Link>
            </div>
          </div>

          <div className="slj-card p-6">
            <h2 className="slj-faint font-sans text-xs uppercase tracking-[0.18em]">
              Snapshot
            </h2>
            <dl className="slj-muted mt-4 space-y-4 font-sans text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt>Sessions completed</dt>
                <dd className="font-medium text-[var(--slj-text)]">
                  {completedChapters} / {totalChapters}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>Next</dt>
                <dd className="text-right font-medium text-[var(--slj-text)]">
                  {nextMilestoneLabel}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="slj-faint font-sans text-xs uppercase tracking-[0.18em]">
                Curriculum
              </h2>
              <p className="mt-2 font-serif text-2xl text-[var(--slj-text)]">
                {curriculumSubtitle}
              </p>
            </div>
            <span className="slj-muted font-sans text-sm">&nbsp;</span>
          </div>

          <div className="space-y-3">
            {variant === "progress" && frontMatterChapters.length > 0 ? (
              <section aria-label="Front matter" className="mb-8">
                <p className="slj-faint mb-3 font-sans text-[11px] uppercase tracking-[0.16em]">
                  Front matter
                </p>
                <div className="space-y-3">
                  {frontMatterChapters.map((chapter) =>
                    renderChapterLink(chapter, richCards)
                  )}
                </div>
              </section>
            ) : null}
            <div className="space-y-3">
              {sessionChapters.map((chapter) =>
                renderChapterLink(chapter, richCards)
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
