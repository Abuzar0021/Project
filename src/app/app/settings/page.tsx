/** Settings: account, theme, plan, voice profile and kept suggestions. */

import { Suspense } from "react";
import type { Metadata } from "next";
import { Settings } from "@/components/app/Settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}
