import type { PixelIcon } from "../types";

// Node tree: a stem branching to two boxes, a plus in the secondary tone at its top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "node-add",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o",
    ".ooo",
    "..o",
    "......#####",
    "..#####...#",
    "..#...#####",
    "..#",
    "..#...#####",
    "..#####...#",
    "......#####",
  ],
};

export default icon;
