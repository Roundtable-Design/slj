import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GroupsListContent } from "@/components/GroupsListContent";
import { fetchUserGroups } from "@/lib/groups";
import { buildSignInHref } from "@/lib/navigation";

export default async function GroupsPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect(buildSignInHref("/groups"));
  }

  const groups = await fetchUserGroups(user.id);
  return <GroupsListContent groups={groups} />;
}
