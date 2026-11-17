import type { PixelIcon } from "../types";

// Speech bubble of `message-01` with the pencil badge of `file-edit`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-edit-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#.......oo",
    "..#..#..o.o",
    "..#.#..o.o",
    "..##..o.o",
    "......oo",
  ],
};

export default icon;
