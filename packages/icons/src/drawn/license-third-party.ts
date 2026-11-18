import type { PixelIcon } from "../types";

// Licence document with two text lines and a person badge in the secondary tone (someone else's licence).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "license-third-party",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.######.#",
    ".#........#",
    ".#.###.ooo",
    ".#.....o.o",
    ".#.....ooo",
    ".#",
    ".####.ooooo",
  ],
};

export default icon;
