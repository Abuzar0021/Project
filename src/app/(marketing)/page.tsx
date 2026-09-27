/**
 * Landing page, top to bottom: hero with the live editor, features, keyboard,
 * privacy promises, and a closing call to action.
 */

import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import {
  ClosingCta,
  KeyboardSection,
  PrivacySection,
} from "@/components/marketing/LandingSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <KeyboardSection />
      <PrivacySection />
      <ClosingCta />
    </>
  );
}
