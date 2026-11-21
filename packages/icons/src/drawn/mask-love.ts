import type { PixelIcon } from "../types";

// Face mask with a heart in the secondary tone, straps either side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mask-love",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "##........##",
    ".#.oo..oo.#",
    ".#.oooooo.#",
    ".#..oooo..#",
    "##...oo...##",
    "..#......#",
    "...######",
  ],
};

export default icon;
