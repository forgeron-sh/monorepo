import type { PixelIcon } from "../types";

// Burj Al Arab: a sail-shaped tower with a straight spine, on its island.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "burj-al-arab",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "...##",
    "...#.#",
    "...#..#",
    "...#..#",
    "...#...#",
    "...#...#",
    "...#...#",
    "...#....#",
    "...#....#",
    ".##########",
  ],
};

export default icon;
