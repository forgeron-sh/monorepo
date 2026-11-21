import type { PixelIcon } from "../types";

// Laptop with a check mark on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-check",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#....o.#",
    "..#.o.o..#",
    "..#..o...#",
    "..#......#",
    "..########",
    ".##########",
  ],
};

export default icon;
