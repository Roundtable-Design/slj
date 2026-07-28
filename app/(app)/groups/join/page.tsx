import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { JoinGroupByCode } from "@/components/JoinGroupByCode";
import { PageShell } from "@/components/ui/surfaces";
import { buildSignInHref } from "@/lib/navigation";

export default async function GroupJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (!code?.trim()) {
    redirect("/groups");
  }

  const session = await auth();

  if (!session?.user) {
    const signInUrl = buildSignInHref(
      `/groups/join?code=${encodeURIComponent(code)}`
    );
    return (
      <PageShell>
        <h1 className="font-serif text-4xl font-semibold leading-none text-[var(--slj-text)]">
          Join group
        </h1>
        <p className="slj-muted mt-3 font-sans text-sm leading-6">
          <Link
            href={signInUrl}
            className="underline underline-offset-4 hover:text-[var(--slj-text)]"
          >
            Sign in
          </Link>{" "}
          to join this group with the invite code.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <h1 className="font-serif text-4xl font-semibold leading-none text-[var(--slj-text)]">
        Join group
      </h1>
      <JoinGroupByCode code={code} />
    </PageShell>
  );
}
