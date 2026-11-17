import type { PixelIcon } from "../types";

// The document with a paperclip in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "document-attachment",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#......ooo",
    ".#.....o...o",
    ".#.....o.o.o",
    ".#.....o.o.o",
    ".#.....o.o",
    ".####...o",
  ],
};

export default icon;
