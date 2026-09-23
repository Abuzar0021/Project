/**
 * Home page (Phase 0 placeholder).
 * Renders a quiet, centered marker on the paper background so we can confirm
 * the theme and both fonts are loading. The real editor shell replaces this in
 * Phase 1.
 */
export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "var(--s-6)",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "36ch" }}>
        <h1 style={{ font: "var(--t-doc-h1)", margin: 0, color: "var(--ink)" }}>
          Margin
        </h1>
        <p
          style={{
            font: "var(--t-ui)",
            marginTop: "var(--s-2)",
            color: "var(--ink-muted)",
          }}
        >
          Suggestions live in the margin. The editor arrives in Phase 1.
        </p>
      </div>
    </main>
  );
}
