import type { PixelIcon } from "../types";

// An arrow up over a line, in a circle: upload. Circle of `circle-arrow-up-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "upload-circle-02",
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
    ".#........#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
