import type { PixelIcon } from "../types";

// Envelope with a shallow 2:1 flap and a cross badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-x",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".##......##",
    ".#.##..##.#",
    ".#...##...#",
    ".#",
    ".#....o...o",
    ".#.....o.o",
    ".####...o",
    ".......o.o",
    "......o...o",
  ],
};

export default icon;
