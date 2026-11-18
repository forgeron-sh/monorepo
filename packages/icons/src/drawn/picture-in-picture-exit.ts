import type { PixelIcon } from "../types";

// Picture in picture exit: a frame with a small inner frame, an arrow leaving it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "picture-in-picture-exit",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.ooo....#",
    ".#.oo.....#",
    ".#.o.o....#",
    ".#....####",
    ".#....#..#",
    ".#....#..#",
    ".#....####",
    ".##########",
  ],
};

export default icon;
