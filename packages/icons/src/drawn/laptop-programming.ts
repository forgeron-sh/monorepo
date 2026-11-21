import type { PixelIcon } from "../types";

// Laptop with a command prompt on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-programming",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#.o....#",
    "..#..o...#",
    "..#.o.oo.#",
    "..#......#",
    "..########",
    ".##########",
  ],
};

export default icon;
