/** Home screen icon for iOS: the mark in white on the site's near-black. */

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090a",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 240 240">
          <rect x="60" y="40" width="26" height="160" rx="6" fill="#f7f8f8" />
          <circle cx="168" cy="88" r="40" fill="#f7f8f8" />
        </svg>
      </div>
    ),
    size,
  );
}
