import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { buildSignInHref } from "@/lib/navigation";
import { PreferencesForm } from "./PreferencesForm";
import { PageShell } from "@/components/ui/surfaces";
import { ThemeToggle } from "./ThemeToggle";
import { ReaderFontToggle } from "./ReaderFontToggle";

export default async function PreferencesPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect(buildSignInHref("/preferences"));
  }

  return (
    <PageShell className="space-y-8 max-w-xl">
      <div>
        <p className="slj-faint font-sans text-xs uppercase tracking-[0.18em]">
          Account
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-none text-[var(--slj-text)]">
          Account
        </h1>
        <p className="slj-muted mt-3 font-sans text-sm leading-6">
          Manage your account and preferences.
        </p>
      </div>

      <section className="slj-card p-4">
        <h2 className="mb-2 font-sans text-sm font-medium text-[var(--slj-text)]">
          Appearance
        </h2>
        <p className="slj-muted mb-4 font-sans text-sm leading-6">
          Choose between light and dark mode. This applies to this device only.
        </p>
        <ThemeToggle />
        <div className="mt-5 border-t border-[var(--slj-border)] pt-4">
          <p className="font-sans text-sm font-medium text-[var(--slj-text)]">
            Reading font
          </p>
          <p className="slj-muted mt-2 font-sans text-sm leading-6">
            Compare readable serif options for course text.
          </p>
          <div className="mt-3">
            <ReaderFontToggle />
          </div>
        </div>
      </section>

      <section className="slj-card p-4">
        <h2 className="mb-2 font-sans text-sm font-medium text-[var(--slj-text)]">
          Email
        </h2>
        <p className="slj-muted font-sans text-sm">{user.email}</p>
      </section>

      <section className="slj-card p-4">
        <h2 className="mb-2 font-sans text-sm font-medium text-[var(--slj-text)]">
          Delete account
        </h2>
        <p className="slj-muted mb-4 font-sans text-sm leading-6">
          Permanently delete your account and all associated data (notes,
          progress, group memberships). This cannot be undone.
        </p>
        <PreferencesForm userEmail={user.email ?? ""} />
      </section>
    </PageShell>
  );
}
