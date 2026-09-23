/**
 * fonts.ts: loads the two typefaces from DESIGN.md section 4 via next/font.
 * Newsreader (serif) is the writer's reading type; Instrument Sans is the
 * interface type. Each is exposed as a CSS variable that tokens.css wraps with a
 * fallback stack, so components only ever reference --font-editor / --font-ui.
 */
import { Newsreader, Instrument_Sans } from "next/font/google";

export const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  // Variable optical-size axis: book-like rendering across sizes. When axes are
  // requested the weight must stay variable, so we do not pin specific weights.
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
});
