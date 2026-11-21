import type { PixelIcon } from "../types";

// Euro sign in a ring: the full-grid ring of `circle` and a C with two-pixel uprights like the S
// of `dollar-circle`, six rows tall and centred, crossed by one two-row bar that sticks out on the
// left; the sign in the secondary tone. Two separate bars do not fit: in six rows they touch the
// arcs (redrawn on 2026-11-17: the first version, in the small ring of `clock-01`, read as a
// stack of dashes, the second as a zigzag).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "euro-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#...oooo.#",
    "#..oo......#",
    "#.ooooo....#",
    "#.ooooo....#",
    "#..oo......#",
    ".#...oooo.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
