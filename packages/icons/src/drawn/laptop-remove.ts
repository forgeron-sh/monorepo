import type { PixelIcon } from "../types";

// Laptop with a minus on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-remove",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#......#",
    "..#.oooo.#",
    "..#......#",
    "..#......#",
    "..########",
    ".##########",
  ],
};

export default icon;
