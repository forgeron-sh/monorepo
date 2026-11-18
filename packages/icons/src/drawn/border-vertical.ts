import type { PixelIcon } from "../types";

// Border vertical: a dotted square with a solid vertical line through its middle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.#.#o#.#.#",
    "......o",
    ".#....o....#",
    "......o",
    ".#....o....#",
    "......o",
    ".#....o....#",
    "......o",
    ".#....o....#",
    "......o",
    ".#.#.#o#.#.#",
  ],
};

export default icon;
