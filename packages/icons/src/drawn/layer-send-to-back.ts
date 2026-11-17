import type { PixelIcon } from "../types";

// Three stacked squares, the highlighted one at the back.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layer-send-to-back",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#",
    ".#...#",
    ".#...####",
    ".#####..#",
    "....#...#",
    "....#...#ooo",
    "....#####..o",
    ".......o...o",
    ".......o...o",
    ".......ooooo",
  ],
};

export default icon;
