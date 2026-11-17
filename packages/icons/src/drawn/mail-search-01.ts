import type { PixelIcon } from "../types";

// Envelope with a shallow 2:1 flap and a magnifier badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-search-01",
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
    ".#....ooo",
    ".#....o.o",
    ".####.ooo",
    ".........o",
    "..........o",
  ],
};

export default icon;
