import { redirect } from "next/navigation";
import { getLastReadPosition } from "@/lib/actions/data";
import { getChapters, getChapter, getFirstInteractiveChapter, getResumeHref } from "@/lib/content";

export default async function CoursePage() {
  const position = await getLastReadPosition();
  const chapters = getChapters();
  const firstChapter = getFirstInteractiveChapter(chapters);

  if (!firstChapter) redirect("/");

  // Only use saved position if that chapter still exists (handles content reorg)
  if (position && getChapter(position.chapterId)) {
    redirect(getResumeHref(chapters, position));
  }

  redirect(`/course/${firstChapter.id}`);
}
