import type { PixelIcon } from "../types";

// AI search: the lens of `search-add` with the AI sparkle inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-search",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...###",
    ".##...##",
    ".#..o..#",
    "#..ooo..#",
    "#.ooooo.#",
    "#..ooo..#",
    ".#..o..#",
    ".##...##",
    "...###.##",
    "........##",
    ".........##",
  ],
};

export default icon;
