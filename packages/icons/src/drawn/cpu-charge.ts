import type { PixelIcon } from "../types";

// Processor charging: the cpu drawing with a lightning badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cpu-charge",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#..#",
    "..########",
    "..#......#",
    ".##......##",
    "..#......#",
    "..#",
    ".##.....oo",
    "..#....oo",
    "..####.ooooo",
    "....#...oo",
    ".......oo",
  ],
};

export default icon;
