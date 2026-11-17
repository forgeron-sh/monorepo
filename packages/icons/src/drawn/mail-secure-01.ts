import type { PixelIcon } from "../types";

// Envelope with a shield: secure mail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-secure-01",
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
    ".#....ooooo",
    ".####.ooooo",
    ".......ooo",
    "........o",
  ],
};

export default icon;
