import type { PixelIcon } from "../types";

// Box with its width and height marked by dimension lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "package-dimensions-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....o.....o",
    "....ooooooo",
    "....o.....o",
    "",
    "o.o.#######",
    ".o..#.#.#.#",
    ".o..#.###.#",
    ".o..#.....#",
    ".o..#.....#",
    ".o..#.....#",
    "o.o.#######",
  ],
};

export default icon;
