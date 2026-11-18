import type { PixelIcon } from "../types";

// Exchange: an arrow right over an arrow left, each with its tail bent towards the other, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "exchange-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".........#",
    ".##########",
    ".#.......#",
    ".#......#",
    "...#......#",
    "..#.......#",
    ".##########",
    "..#",
    "...#",
  ],
};

export default icon;
