import type { PixelIcon } from "../types";

// Envelope with an arrow in the secondary tone coming down into it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-receive-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "..o..oo..o",
    "...o.oo.o",
    "....oooo",
    ".....oo",
    "",
    ".##########",
    ".#.##..##.#",
    ".#...##...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
