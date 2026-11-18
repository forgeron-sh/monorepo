import type { PixelIcon } from "../types";

// Gemini: two pillars between a curved top and bottom bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-gemini",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#........#",
    "..########",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "..########",
    ".#........#",
  ],
};

export default icon;
