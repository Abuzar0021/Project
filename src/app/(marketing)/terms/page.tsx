import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return <ComingSoon title="Terms" />;
}
