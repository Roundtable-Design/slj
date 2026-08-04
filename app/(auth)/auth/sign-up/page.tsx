import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignUpForm } from "@/components/SignUpForm";
import { SiteFooter } from "@/components/SiteFooter";
import { TalksFromTheWarehouseLink } from "@/components/TalksFromTheWarehouseLink";
import { sanitizeReturnTo } from "@/lib/navigation";
import { COURSE_TITLE } from "@/lib/site-branding";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const returnTo = sanitizeReturnTo(params.returnTo);

  const session = await auth();
  if (session?.user) {
    redirect(returnTo);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--slj-bg)] px-6 py-10 text-[var(--slj-text)] md:px-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <TalksFromTheWarehouseLink className="mb-8" />
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center">
        <div className="w-full max-w-md border border-[var(--slj-border)] bg-[var(--slj-surface)] p-8 md:p-10">
          <p className="slj-faint font-sans text-xs uppercase tracking-[0.18em]">
            Create account
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-none">
            {COURSE_TITLE}
          </h1>
          <p className="slj-muted mt-4 font-sans text-sm leading-6">
            Enter your email to create an account. First and last name are
            optional. We&apos;ll send a link to finish signing up.
          </p>
          <div className="mt-6">
            <SignUpForm returnTo={returnTo} />
          </div>
        </div>
      </div>
      <SiteFooter className="mx-auto mt-10 w-full max-w-5xl" />
    </main>
  );
}
