/** Contact page, a placeholder until a contact address or form exists. */

import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return <ComingSoon title="Contact" />;
}
