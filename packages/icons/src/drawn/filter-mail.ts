import type { PixelIcon } from "../types";

// Envelope with a funnel badge, mail filter (the base of mail-add-01).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter-mail",
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
    ".#....ooooo",
    ".#.....ooo",
    ".####...o",
    "........o",
    "........o",
  ],
};

export default icon;
