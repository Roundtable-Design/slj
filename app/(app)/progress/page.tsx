import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { buildSignInHref } from "@/lib/navigation";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user) {
    redirect(buildSignInHref("/progress"));
  }

  return <ProgressDashboard variant="progress" />;
}
