import type { PixelIcon } from "../types";

// The open book of `book-open-01` with a check on its right page in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "book-open-check",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    "#....##....#",
    "#.##.##....#",
    "#....##...o#",
    "#.##.##o.o.#",
    "#....##.o..#",
    "#.##.##....#",
    "#....##....#",
    ".####..####",
  ],
};

export default icon;
