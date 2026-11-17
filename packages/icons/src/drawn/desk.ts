import type { PixelIcon } from "../types";

// Desk: a top, a leg on the left and a two-drawer unit on the right with handles.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "desk",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "############",
    ".#.....#...#",
    ".#.....#.o.#",
    ".#.....#####",
    ".#.....#...#",
    ".#.....#.o.#",
    ".#.....#####",
  ],
};

export default icon;
