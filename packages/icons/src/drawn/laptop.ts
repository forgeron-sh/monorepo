import type { PixelIcon } from "../types";

// Laptop: a screen and a wider base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
    ".##########",
  ],
};

export default icon;
