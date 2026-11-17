import type { PixelIcon } from "../types";

// Laptop with a lightning bolt on its screen: charging.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-charging",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#....o.#",
    "..#.oooo.#",
    "..#.o....#",
    "..#......#",
    "..########",
    ".##########",
  ],
};

export default icon;
