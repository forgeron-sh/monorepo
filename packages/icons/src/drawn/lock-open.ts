import type { PixelIcon } from "../types";

// Open padlock: `lock` with the shackle's right leg lifted out of the body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lock-open",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#",
    "...#",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
