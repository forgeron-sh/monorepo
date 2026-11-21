import type { PixelIcon } from "../types";

// Laptop with a cloud on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-cloud",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#...oo.#",
    "..#..oooo#",
    "..#.ooooo#",
    "..#......#",
    "..########",
    ".##########",
  ],
};

export default icon;
