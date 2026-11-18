import type { PixelIcon } from "../types";

// Envelope of `mail-reply-01` with a double reply arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-reply-all-01",
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
    ".#....o.oooo",
    ".####..o.o.o",
    "...........o",
    "...........o",
  ],
};

export default icon;
