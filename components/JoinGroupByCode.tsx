"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { actionJoinGroupByCode } from "@/lib/actions/data";

export function JoinGroupByCode({ code }: { code: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "joining" | "done">("idle");

  useEffect(() => {
    if (!code.trim() || status !== "idle") return;
    setStatus("joining");
    actionJoinGroupByCode(code)
      .then((groupId) => {
        setStatus("done");
        router.replace(`/groups/${groupId}`);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not join group");
        setStatus("idle");
      });
  }, [code, router, status]);

  if (error) {
    return (
      <div className="font-sans">
        <p className="text-[var(--slj-text)]">{error}</p>
        <Link
          href="/groups"
          className="slj-muted mt-2 inline-block text-sm underline underline-offset-4 hover:text-[var(--slj-text)]"
        >
          Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <p className="slj-muted">Joining group...</p>
    </div>
  );
}
