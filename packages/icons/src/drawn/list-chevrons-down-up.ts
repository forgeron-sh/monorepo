import type { PixelIcon } from "../types";

// List with two chevrons pointing at each other: collapse.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-chevrons-down-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#####.o..o",
    "........oo",
    "",
    ".#####",
    "",
    "........oo",
    ".#####.o..o",
  ],
};

export default icon;
