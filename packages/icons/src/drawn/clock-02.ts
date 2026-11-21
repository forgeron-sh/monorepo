import type { PixelIcon } from "../types";

// Clock: the ring of `clock-01` and two-pixel hands from a 2×2 centre to 12 and 3, in the secondary tone, centred exactly.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oooo.#",
    ".#...oooo.#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
