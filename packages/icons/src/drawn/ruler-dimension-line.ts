import type { PixelIcon } from "../types";

// Ruler under a dimension line: the ruler, and above it a measured span with end ticks in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ruler-dimension-line",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o........o",
    ".oooooooooo",
    ".o........o",
    "",
    ".##########",
    ".#.#.##.#.#",
    ".#...##...#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
