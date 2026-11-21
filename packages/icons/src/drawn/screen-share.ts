import type { PixelIcon } from "../types";

// Share screen: the monitor of `computer` with an arrow in the secondary tone rising out of the
// bottom edge of the screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "screen-share",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#.o.oo.o.#",
    ".#...oo...#",
    ".##########",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
