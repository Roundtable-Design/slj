import Link from "next/link";
import { auth } from "@/auth";
import { AppNav } from "@/components/AppNav";
import { SiteFooter } from "@/components/SiteFooter";
import { TalksFromTheWarehouseLink } from "@/components/TalksFromTheWarehouseLink";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { buildNavChapters } from "@/lib/nav-chapters";
import {
  COURSE_AUTHOR,
  COURSE_INFO_EMAIL,
  COURSE_SUBTITLE,
  COURSE_TITLE,
  PRINT_VERSION_MAILTO,
} from "@/lib/site-branding";

export default async function LandingPage() {
  const session = await auth();
  const user = session?.user;

  if (user) {
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--slj-bg)] text-[var(--slj-text)]">
        <AppNav userEmail={user.email} chapters={buildNavChapters()} />
        <main className="min-h-0 min-w-0 flex-1 overflow-auto px-4 pb-6 pt-16 md:px-8 md:py-8 lg:px-10 lg:py-10">
          <ProgressDashboard />
        </main>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--slj-bg)] px-6 py-10 text-[var(--slj-text)] md:px-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <TalksFromTheWarehouseLink className="mb-8" />
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center">
        <section className="w-full max-w-2xl border border-[var(--slj-border)] bg-[var(--slj-surface)] p-8 md:p-12">
          <p className="slj-faint font-sans text-xs uppercase tracking-[0.18em]">
            {COURSE_SUBTITLE}
          </p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-none md:text-7xl">
            {COURSE_TITLE}
          </h1>
          <p className="slj-muted mt-6 font-serif text-2xl leading-tight md:text-3xl">
            {COURSE_AUTHOR}
          </p>
          <p className="slj-muted mt-6 font-sans text-sm leading-6">
            A print version of this course is also available.{" "}
            <a
              href={PRINT_VERSION_MAILTO}
              className="text-[var(--slj-text)] underline underline-offset-2 hover:opacity-80"
            >
              Email {COURSE_INFO_EMAIL}
            </a>{" "}
            to request a copy.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/auth/sign-in" className="slj-button inline-flex px-5 py-3 text-sm">
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="font-sans text-sm text-[var(--slj-text)] underline underline-offset-2 hover:opacity-80"
            >
              Create account
            </Link>
          </div>
        </section>
      </div>
      <SiteFooter className="mx-auto mt-10 w-full max-w-5xl" />
    </main>
  );
}
