/** Link preview image: a plain render of the editor with two margin notes. */

import { ImageResponse } from "next/og";

export const alt = "Margin: a writing editor with notes beside your text";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#e4e5e9";
const INK_2 = "#9a9ca5";
const RULE = "#24262b";

function Line({ width, mark }: { width: number; mark?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div
        style={{ width, height: 12, borderRadius: 6, background: "#2c2e34" }}
      />
      {mark ? (
        <div style={{ width: 120, height: 3, background: mark }} />
      ) : null}
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#08090a",
          padding: 56,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            background: "#0e0f11",
            border: `1px solid ${RULE}`,
            borderRadius: 18,
            padding: "56px 64px",
            gap: 56,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 44,
                color: INK,
                fontWeight: 600,
                letterSpacing: -1.5,
                marginBottom: 18,
              }}
            >
              Pricing update for early customers
            </div>
            <Line width={560} />
            <Line width={420} mark="#8c9eff" />
            <Line width={600} />
            <Line width={380} mark="#f0766e" />
            <Line width={520} />
            <Line width={300} mark="#4cc2ae" />
          </div>
          <div
            style={{
              width: 280,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              paddingTop: 110,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "#16171a",
                border: `1px solid ${RULE}`,
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: 16, color: INK_2 }}>Passive voice</div>
              <div style={{ fontSize: 20, color: INK }}>the team decided</div>
            </div>
            <div style={{ fontSize: 16, color: INK_2, padding: "0 16px" }}>
              Spelling
            </div>
            <div style={{ fontSize: 20, color: INK, padding: "0 16px" }}>
              receive
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
