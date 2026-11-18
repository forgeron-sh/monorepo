import type { PixelIcon } from "../types";

// Letter C: the ring of `clock-01` open on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "c",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#",
    "..#......#",
    "...######",
  ],
};

export default icon;
