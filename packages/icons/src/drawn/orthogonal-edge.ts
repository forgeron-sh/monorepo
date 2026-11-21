import type { PixelIcon } from "../types";

// Orthogonal edge: two nodes in the secondary tone joined by a connector with a right angle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "orthogonal-edge",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".ooo",
    ".o.o######",
    ".ooo.....#",
    ".........#",
    ".........#",
    ".........#",
    ".........#",
    "........ooo",
    "........o.o",
    "........ooo",
  ],
};

export default icon;
