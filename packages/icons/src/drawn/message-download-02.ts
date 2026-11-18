import type { PixelIcon } from "../types";

// Speech bubble with a download arrow inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-download-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#...oo...#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#........#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
