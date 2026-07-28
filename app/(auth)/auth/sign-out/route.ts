import { signOut } from "@/auth";
import { redirect } from "next/navigation";

export async function POST() {
  await signOut({ redirect: false });
  redirect("/");
}

export async function GET() {
  await signOut({ redirect: false });
  redirect("/");
}
