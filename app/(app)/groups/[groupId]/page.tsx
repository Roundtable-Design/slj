import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { fetchGroup } from "@/lib/groups";
import { CopyInviteLinkClient } from "@/components/CopyInviteLinkClient";
import { GroupSharedNotesEditor } from "@/components/GroupSharedNotesEditor";
import { CardSection, PageShell } from "@/components/ui/surfaces";
import { buildSignInHref } from "@/lib/navigation";

function formatStartDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "Z");
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    redirect(buildSignInHref(`/groups/${groupId}`));
  }

  const group = await fetchGroup(user.id, groupId);
  if (!group) {
    redirect("/groups");
  }

  return (
    <PageShell className="space-y-6">
      <p className="slj-muted font-sans text-sm">
        <Link href="/groups" className="underline underline-offset-4 hover:text-[var(--slj-text)]">
          ← Groups
        </Link>
      </p>
      <h1 className="font-serif text-4xl font-semibold leading-none text-[var(--slj-text)]">
        {group.name}
      </h1>
      <p className="slj-muted font-sans text-sm leading-6">
        <span className="font-medium text-[var(--slj-text)]">Start date:</span>{" "}
        {formatStartDate(group.start_date)}
      </p>
      <p className="slj-muted font-sans text-sm leading-6">
        Invite link:{" "}
        <Link
          href={`/groups/join?code=${encodeURIComponent(group.invite_code)}`}
          className="break-all underline underline-offset-4 hover:text-[var(--slj-text)]"
        >
          /groups/join?code={group.invite_code}
        </Link>
        {" — "}
        <CopyInviteLinkClient code={group.invite_code} />
      </p>
      <CardSection>
        <GroupSharedNotesEditor
          groupId={group.id}
          initialValue={group.shared_notes}
        />
      </CardSection>
    </PageShell>
  );
}
