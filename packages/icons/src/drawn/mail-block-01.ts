import type { PixelIcon } from "../types";

// Envelope with a no-entry sign: block a sender.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-block-01",
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
    ".#....o..oo",
    ".####.o.o.o",
    "......oo..o",
    ".......ooo",
  ],
};

export default icon;
