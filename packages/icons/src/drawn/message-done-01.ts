import type { PixelIcon } from "../types";

// Speech bubble of `message-01` with the check badge of `user-check-01` in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-done-01",
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
    ".#........#",
    ".#",
    "..#..###..o",
    "..#.#....o",
    "..##..o.o",
    ".......o",
  ],
};

export default icon;
