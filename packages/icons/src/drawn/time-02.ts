import type { PixelIcon } from "../types";

// Clock: the ring of `clock-01`, one hand up and one going down to the right at 45°, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "time-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...o....#",
    ".#...o....#",
    ".#...o....#",
    ".#...oo...#",
    ".#.....o..#",
    ".#......o.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
