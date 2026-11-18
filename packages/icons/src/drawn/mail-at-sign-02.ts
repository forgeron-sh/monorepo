import type { PixelIcon } from "../types";

// Envelope with an at-sign badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-at-sign-02",
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
    ".#....o...o",
    ".####.o.ooo",
    "......o.ooo",
    "......o",
    ".......ooo",
  ],
};

export default icon;
