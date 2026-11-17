import type { PixelIcon } from "../types";

// Laptop with a gauge on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-performance",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#..oo..#",
    "..#.o..o.#",
    "..#.o.oo.#",
    "..#......#",
    "..########",
    ".##########",
  ],
};

export default icon;
