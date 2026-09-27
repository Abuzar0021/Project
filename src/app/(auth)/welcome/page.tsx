import type { Metadata } from "next";
import { Welcome } from "@/components/auth/Welcome";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false },
};

export default function WelcomePage() {
  return <Welcome />;
}
