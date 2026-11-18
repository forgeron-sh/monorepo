import type { PixelIcon } from "../types";

// The Gemini mark: a four-pointed sparkle with curved, pinched sides.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "google-gemini",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".....##",
    ".....##",
    "....####",
    "..########",
    "############",
    "############",
    "..########",
    "....####",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
