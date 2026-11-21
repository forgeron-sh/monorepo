import type { PixelIcon } from "../types";

// Notifications off: the bell of `notification-01` struck by a 45° slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "notification-off-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o...##",
    "..o.#..#",
    "...o....#",
    "...#o...#",
    "...#.o..#",
    "..#...o..#",
    ".#.....o..#",
    ".#######o##",
    ".........o",
    ".....##...o",
    "...........o",
  ],
};

export default icon;
