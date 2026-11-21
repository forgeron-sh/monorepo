import type { PixelIcon } from "../types";

// Open envelope with a letter rising out of it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-open-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oooooo",
    "...o....o",
    "...o.oo.o",
    "...o....o",
    ".#.o....o.#",
    ".##......##",
    ".#.##..##.#",
    ".#...##...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
