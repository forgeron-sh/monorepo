import type { PixelIcon } from "../types";

// Cloud of `rain` with one big round hailstone in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-hailstone",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..########",
    "",
    ".....oo",
    "....oooo",
    "....oooo",
    ".....oo",
  ],
};

export default icon;
