import type { PixelIcon } from "../types";

// Picture with a play badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-play",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#......#",
    ".#...##.#",
    ".#...##.#",
    ".#",
    ".#.#...o",
    ".####..oo",
    ".####..ooo",
    ".......oo",
    ".......o",
  ],
};

export default icon;
