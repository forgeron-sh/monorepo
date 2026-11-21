import type { PixelIcon } from "../types";

// Toilet seen from the side: a tank, the seat, a bowl narrowing to its foot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "toilet-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#..#",
    ".#..#",
    ".#..#",
    ".##########",
    ".#........#",
    "..#......#",
    "...#....#",
    "....#..#",
    "...######",
  ],
};

export default icon;
