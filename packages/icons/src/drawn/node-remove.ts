import type { PixelIcon } from "../types";

// Node tree: a stem branching to two boxes, a cross in the secondary tone at its top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "node-remove",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o.o",
    "..o",
    ".o.o",
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
