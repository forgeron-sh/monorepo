import type { PixelIcon } from "../types";

// Speech bubble with its tail on the right and a plus inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "comment-add-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#........#",
    "..#####..#",
    ".......#.#",
    "........##",
  ],
};

export default icon;
