import { auth } from "@/auth";
import { AppNav } from "@/components/AppNav";
import { ContentRevisionPoller } from "@/components/dev/ContentRevisionPoller";
import { ReturnToReadingButton } from "@/components/ReturnToReadingButton";
import { BackToSearchButton } from "@/components/BackToSearchButton";
import { ScrollReturnManager } from "@/components/ScrollReturnManager";
import { buildNavChapters } from "@/lib/nav-chapters";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const navChapters = buildNavChapters();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--slj-bg)] text-[var(--slj-text)]">
      {process.env.NODE_ENV === "development" ? <ContentRevisionPoller /> : null}
      <ScrollReturnManager />
      <ReturnToReadingButton />
      <BackToSearchButton />
      <AppNav userEmail={session?.user?.email} chapters={navChapters} />
      <main
        id="app-main-scroll"
        className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-16 md:px-8 md:py-8 lg:px-10 lg:py-10"
      >
        {children}
      </main>
    </div>
  );
}
