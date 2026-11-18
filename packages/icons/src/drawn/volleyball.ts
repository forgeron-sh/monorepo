import type { PixelIcon } from "../types";

// Volleyball: the ring of `basketball-01` with three curved seams in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "volleyball",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..##.o..##",
    ".#...o....#",
    ".#...o...o#",
    ".#...oooo.#",
    ".#..o.....#",
    ".#.o......#",
    "..o.....##",
    "..##....##",
    "...######",
  ],
};

export default icon;
