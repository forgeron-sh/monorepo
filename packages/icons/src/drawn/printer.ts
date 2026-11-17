import type { PixelIcon } from "../types";

// Printer: a sheet going in at the top, the body, a sheet coming out of a slot inside
// the body (a sheet that only hung below read as a blob at 16 px).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the sheet coming out.
const icon: PixelIcon = {
  name: "printer",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#.o....o.#",
    ".##o....o##",
    "...o....o",
    "...oooooo",
  ],
};

export default icon;
