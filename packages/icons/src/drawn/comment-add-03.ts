import type { PixelIcon } from "../types";

// Square speech bubble with a centred tail and a plus inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "comment-add-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#........#",
    ".####..####",
    "....#..#",
    ".....##",
  ],
};

export default icon;
