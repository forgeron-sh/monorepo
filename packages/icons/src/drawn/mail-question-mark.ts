import type { PixelIcon } from "../types";

// Envelope with a question mark: mail help.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-question-mark",
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
    ".#........o",
    ".####...oo",
    "",
    "........o",
  ],
};

export default icon;
