/** Onboarding: the first stop after sign up, where writers add past writing. */

import type { Metadata } from "next";
import { Welcome } from "@/components/auth/Welcome";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false },
};

export default function WelcomePage() {
  return <Welcome />;
}
