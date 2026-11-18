import type { PixelIcon } from "../types";

// Laptop with a plus on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-add",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#..oo..#",
    "..#.oooo.#",
    "..#..oo..#",
    "..#......#",
    "..########",
    ".##########",
  ],
};

export default icon;
