import type { PixelIcon } from "../types";

// A down chevron in the frame of `square`, the chevron of `circle-chevron-down`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-chevron-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#.o....o.#",
    ".#.oo..oo.#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
