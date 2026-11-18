import type { PixelIcon } from "../types";

// Envelope with a person: mail account.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-account-01",
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
    ".#.....o.o",
    ".####..ooo",
    "",
    "......ooooo",
  ],
};

export default icon;
