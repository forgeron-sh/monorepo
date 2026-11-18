import type { PixelIcon } from "../types";

// Envelope with a heart: a loving message.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-love-01",
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
    ".#",
    ".#....oo.oo",
    ".####.ooooo",
    ".......ooo",
    "........o",
  ],
};

export default icon;
