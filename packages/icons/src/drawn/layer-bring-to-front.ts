import type { PixelIcon } from "../types";

// Three stacked squares, the highlighted one on top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layer-bring-to-front",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".ooooo",
    ".o...o",
    ".o...o",
    ".o...o###",
    ".ooooo..#",
    "....#...#",
    "....#...####",
    "....#####..#",
    ".......#...#",
    ".......#...#",
    ".......#####",
  ],
};

export default icon;
