/** Changelog page, a placeholder until the first release notes. */

import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export const metadata: Metadata = { title: "Changelog" };

export default function ChangelogPage() {
  return <ComingSoon title="Changelog" />;
}
