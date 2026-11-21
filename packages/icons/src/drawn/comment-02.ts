import type { PixelIcon } from "../types";

// The bubble of `comment-01` mirrored, tail on the right, its lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "comment-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#........#",
    ".#...oooo.#",
    ".#........#",
    "..#####..#",
    ".......#.#",
    "........##",
  ],
};

export default icon;
