import type { PixelIcon } from "../types";

// A desk telephone: the handset resting on a base with a dial.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "telephone",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".###....###",
    "...#....#",
    "..#.oooo.#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..oooo..#",
    ".##########",
  ],
};

export default icon;
