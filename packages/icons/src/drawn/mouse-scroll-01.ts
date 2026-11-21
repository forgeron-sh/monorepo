import type { PixelIcon } from "../types";

// Mouse of `mouse-01` beside an up-and-down scroll arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mouse-scroll-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####...o",
    ".#.oo.#.ooo",
    ".#.oo.#..o",
    ".#....#..o",
    ".######..o",
    ".#....#..o",
    ".#....#..o",
    ".#....#.ooo",
    ".#....#..o",
    "..####",
  ],
};

export default icon;
