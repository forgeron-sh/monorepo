import type { PixelIcon } from "../types";

// Picture in picture on: a frame with a small inner frame, an arrow going into it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "picture-in-picture-on",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.o.o....#",
    ".#..oo....#",
    ".#.ooo....#",
    ".#....####",
    ".#....#..#",
    ".#....#..#",
    ".#....####",
    ".##########",
  ],
};

export default icon;
