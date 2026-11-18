import type { PixelIcon } from "../types";

// Location update: a map pin with a circular arrow badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-update-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####",
    ".#....#",
    ".#.##.#",
    ".#.##.#",
    "..#..#",
    "...##..oo.o",
    "......o..oo",
    "......o.ooo",
    "......o",
    ".......ooo",
  ],
};

export default icon;
