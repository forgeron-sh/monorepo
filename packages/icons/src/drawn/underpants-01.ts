import type { PixelIcon } from "../types";

// Briefs: a waistband over a body narrowing to the crotch.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "underpants-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#........#",
    "..##....##",
    "....#..#",
    "....####",
  ],
};

export default icon;
