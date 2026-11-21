import type { PixelIcon } from "../types";

// Picture with a check badge, in the badge corner of the file-* family.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-done-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "##########",
    "#........#",
    "#.....##.#",
    "#.....##.#",
    "#........#",
    "#..#.....#",
    "#.###",
    "#####......o",
    "#.........o",
    "######.o.o",
    "........o",
  ],
};

export default icon;
