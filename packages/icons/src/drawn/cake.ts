import type { PixelIcon } from "../types";

// Two-tier cake with a candle, the flame in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cake",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....##",
    ".....##",
    "..########",
    "..#......#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
