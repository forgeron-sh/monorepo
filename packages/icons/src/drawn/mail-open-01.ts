import type { PixelIcon } from "../types";

// Open envelope: the flap raised above a box, the fold inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-open-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "...##..##",
    ".##......##",
    ".#........#",
    ".##......##",
    ".#.##..##.#",
    ".#...##...#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
