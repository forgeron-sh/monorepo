import type { PixelIcon } from "../types";

// Add in a ring: the ring of `clock-01`, a two-pixel plus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "add-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
