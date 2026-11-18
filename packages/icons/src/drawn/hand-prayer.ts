import type { PixelIcon } from "../types";

// Praying hands: two hands joined upright palm to palm, a one-pixel seam between them and a cuff under each.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hand-prayer",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#.#",
    "....##.##",
    "....##.##",
    "...###.###",
    "...###.###",
    "..####.####",
    "..###...###",
    "",
    "..###...###",
  ],
};

export default icon;
