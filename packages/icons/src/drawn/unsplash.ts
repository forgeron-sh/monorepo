import type { PixelIcon } from "../types";

// The Unsplash mark: a small block above a wide block with a matching notch.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "unsplash",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....####",
    "....####",
    "",
    ".###....###",
    ".###....###",
    ".###....###",
    ".##########",
    ".##########",
    ".##########",
  ],
};

export default icon;
