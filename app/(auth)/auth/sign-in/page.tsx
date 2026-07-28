import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm } from "@/components/SignInForm";
import { SiteFooter } from "@/components/SiteFooter";
import { TalksFromTheWarehouseLink } from "@/components/TalksFromTheWarehouseLink";
import { sanitizeReturnTo } from "@/lib/navigation";
import { COURSE_TITLE } from "@/lib/site-branding";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string | string[];
    error?: string | string[];
    sent?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const returnTo = sanitizeReturnTo(params.returnTo);
  const authError =
    params.error != null
      ? "That sign-in link was invalid or expired. Enter your email below and we will send a fresh magic link."
      : null;
  const initialSent = params.sent === "1" || params.sent?.[0] === "1";
  const allowDevLogin =
    process.env.AUTH_DEV_LOGIN === "1" ||
    Boolean(process.env.AUTH_E2E_SECRET);

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
            Sign in
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-none">
            {COURSE_TITLE}
          </h1>
          <p className="slj-muted mt-4 font-sans text-sm leading-6">
            Enter your email. We&apos;ll send a sign-in link you can use to open
            the course.
          </p>
          <div className="mt-6">
            <SignInForm
              returnTo={returnTo}
              initialError={authError}
              initialSent={initialSent}
              allowDevLogin={allowDevLogin}
            />
          </div>
        </div>
      </div>
      <SiteFooter className="mx-auto mt-10 w-full max-w-5xl" />
    </main>
  );
}
