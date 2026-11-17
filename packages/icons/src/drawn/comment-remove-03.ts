import type { PixelIcon } from "../types";

// Square speech bubble with a centred tail and a minus inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "comment-remove-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#........#",
    ".#........#",
    ".####..####",
    "....#..#",
    ".....##",
  ],
};

export default icon;
