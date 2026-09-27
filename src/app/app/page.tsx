"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app/AppContext";

export default function AppHome() {
  const router = useRouter();
  const { drafts, newDraft } = useApp();

  useEffect(() => {
    const latest = drafts[0];
    if (latest) router.replace(`/app/d/${latest.id}`);
    else newDraft();
  }, [drafts, newDraft, router]);

  return null;
}
