import type { PixelIcon } from "../types";

// Outer border: the square outline solid in the secondary tone, the inner lines dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-full",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".ooooooooo",
    ".o.......o",
    ".o...#...o",
    ".o.......o",
    ".o.#.#.#.o",
    ".o.......o",
    ".o...#...o",
    ".o.......o",
    ".ooooooooo",
  ],
};

export default icon;
