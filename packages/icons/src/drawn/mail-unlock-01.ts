import type { PixelIcon } from "../types";

// Envelope with an open padlock: unlocked mail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-unlock-01",
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
    ".#.....ooo",
    ".#.....o",
    ".####.ooooo",
    "......ooooo",
    "......ooooo",
  ],
};

export default icon;
