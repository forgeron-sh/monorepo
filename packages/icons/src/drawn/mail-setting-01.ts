import type { PixelIcon } from "../types";

// Envelope with a cog: mail settings.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-setting-01",
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
    ".#.....o.o",
    ".#....ooooo",
    ".####.oo.oo",
    "......ooooo",
    ".......o.o",
  ],
};

export default icon;
