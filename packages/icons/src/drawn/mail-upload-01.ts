import type { PixelIcon } from "../types";

// Envelope with an up arrow: upload mail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-upload-01",
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
    ".#......o",
    ".#.....ooo",
    ".####.o.o.o",
    "........o",
    "........o",
  ],
};

export default icon;
