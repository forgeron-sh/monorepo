import type { PixelIcon } from "../types";

// A sperm cell: an oval head and a wavy tail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "sperm",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "..##",
    ".####.##",
    ".#####..#..#",
    "..##.....##",
  ],
};

export default icon;
