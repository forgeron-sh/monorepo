import type { PixelIcon } from "../types";

// Right-to-left list with triangles: lines on the left, a triangle bullet pointing left on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "right-to-left-list-triangle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........o",
    ".#######.oo",
    "..........o",
    "",
    "..........o",
    ".#######.oo",
    "..........o",
    "",
    "..........o",
    ".#######.oo",
    "..........o",
  ],
};

export default icon;
