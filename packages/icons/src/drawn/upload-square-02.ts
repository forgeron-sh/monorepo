import type { PixelIcon } from "../types";

// Upload in a square: the frame of `square-arrow-up-01` around an arrow over a tray line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "upload-square-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
