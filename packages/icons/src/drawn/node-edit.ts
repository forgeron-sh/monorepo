import type { PixelIcon } from "../types";

// Node tree: a stem branching to two boxes, a pencil in the secondary tone at its top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "node-edit",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..oo",
    ".o.o",
    "o.o",
    "oo",
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
