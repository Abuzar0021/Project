/**
 * LogoMark: the flat two-shape brand glyph (DESIGN 8.7). A rounded bar for the
 * page's edge and a dot for the note pinned beside it. Fills use currentColor, so
 * the mark takes --ink from its parent and inverts with the theme.
 *
 * The geometry matches public/margin-mark.svg (the dithered logo's source) and
 * src/app/icon.svg (the favicon). Change all three together.
 */
export function LogoMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="6.5" y="5" width="7" height="22" rx="3.5" fill="currentColor" />
      <circle cx="21" cy="11" r="4.5" fill="currentColor" />
    </svg>
  );
}
