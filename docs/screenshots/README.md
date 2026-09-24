# Screenshots

Pitch screenshots of Margin at three widths in both themes, captured with
Playwright against the production build (LanguageTool mocked so all four
categories show):

- `light-1440.png`, `dark-1440.png` — desktop, full margin rail
- `light-900.png`, `dark-900.png` — tablet, collapsed dot rail
- `light-390.png`, `dark-390.png` — mobile, inline marks, no rail or minimap

## Design review (Phase 9)

Reviewed each width and theme against `DESIGN.md`, especially section 13
("things that must not appear"): no gradients or glassmorphism, no all-caps
tracked eyebrows, no `01 / 02 / 03` numbering, no page-load choreography, no
one-word color/italic headline tricks, no generic component-kit look, no
decorative monospace, and icons only where they carry meaning (category dots,
chevron, sun/moon). Type scale, spacing rhythm, radius hierarchy, AA contrast,
and focus rings check out in both themes.

One element removed for calm: the persistent idle "All checked" status label.
It was reassurance that says nothing actionable and crowded the filter chips at
tablet width; the clean marks and the score already communicate "all good", so
the status now speaks only when it needs the writer's attention (checking,
paused).
