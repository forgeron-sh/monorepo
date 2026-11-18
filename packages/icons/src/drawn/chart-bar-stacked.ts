import type { PixelIcon } from "../types";

// Stacked bar chart: an axis with two horizontal bars in two segments, the second segment in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-bar-stacked",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#",
    ".#.###.ooo",
    ".#.###.ooo",
    ".#",
    ".#",
    ".#.#####.oo",
    ".#.#####.oo",
    ".#",
    ".##########",
  ],
};

export default icon;
