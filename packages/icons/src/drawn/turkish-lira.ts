import type { PixelIcon } from "../types";

// Turkish lira sign: a stem with two rising bars and a foot curving up to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "turkish-lira",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#",
    "....#",
    "....#..#",
    "....###",
    "..###..#",
    "....###",
    "..###",
    "....#....#",
    "....#...#",
    "....####",
  ],
};

export default icon;
