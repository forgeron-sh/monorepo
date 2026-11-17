import type { PixelIcon } from "../types";

// French fries: sticks in the secondary tone rising from a carton.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "french-fries-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....o..o",
    "..o.o..o.o",
    "..o.o..o.o",
    "..o.o..o.o",
    ".##########",
    ".#........#",
    ".#........#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
