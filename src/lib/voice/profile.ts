/**
 * The voice profile: measurements from uploaded writing plus the writer's
 * other drafts long enough to learn from.
 */

import type { Draft } from "@/lib/drafts";
import { docText } from "@/lib/drafts";
import { readJSON, writeJSON } from "@/lib/storage";
import { combine, measure, type VoiceSample } from "./features";

/** Drafts shorter than this say too little about how someone writes. */
export const MIN_PROFILE_WORDS = 150;

export interface VoiceProfile {
  sample: VoiceSample;
  count: number;
  uploads: number;
}

const key = (email: string) => `voice:${email}`;

export function uploadedSamples(email: string): VoiceSample[] {
  return readJSON<VoiceSample[]>(key(email), []);
}

/** Only the measurements are stored; the file's text is dropped here. */
export function addUploadedText(email: string, text: string): VoiceSample {
  const sample = measure(text);
  writeJSON(key(email), [...uploadedSamples(email), sample]);
  return sample;
}

export function resetUploads(email: string): void {
  writeJSON(key(email), []);
}

/** A profile from raw texts, used for the landing page sample account. */
export function profileFromTexts(
  texts: string[],
  count = texts.length,
): VoiceProfile {
  return { sample: combine(texts.map(measure)), count, uploads: 0 };
}

/** Uploaded writing plus every other draft long enough to learn from. */
export function buildProfile(
  email: string,
  drafts: Draft[],
  excludeId?: string,
): VoiceProfile | null {
  const uploads = uploadedSamples(email);
  const fromDrafts = drafts
    .filter(
      (draft) => draft.id !== excludeId && draft.words >= MIN_PROFILE_WORDS,
    )
    .map((draft) => measure(docText(draft.content)));
  const samples = [...uploads, ...fromDrafts];
  if (samples.length === 0) return null;
  return {
    sample: combine(samples),
    count: samples.length,
    uploads: uploads.length,
  };
}
