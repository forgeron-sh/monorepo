import type { PixelIcon } from "../types";

// The brain-01 outline with a small sparkle inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-brain-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "..#..##..#",
    ".#....o...#",
    ".#...ooo..#",
    ".#....o...#",
    "..#.......#",
    "...#####.#",
    ".......#.#",
    ".......#.#",
  ],
};

export default icon;
