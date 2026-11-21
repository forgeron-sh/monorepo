import type { PixelIcon } from "../types";

// Arrow up in a ring: the ring of `clock-01` and a solid arrow (three-row head, two-pixel shaft) in the secondary tone, centred exactly.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-up-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
