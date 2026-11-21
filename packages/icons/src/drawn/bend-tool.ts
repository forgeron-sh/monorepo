import type { PixelIcon } from "../types";

// Bend tool: a curve between two square nodes, the nodes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bend-tool",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......ooo",
    ".......o.o",
    "....###ooo",
    "...#",
    "..#",
    "..#",
    "..#",
    ".ooo",
    ".o.o",
    ".ooo",
  ],
};

export default icon;
