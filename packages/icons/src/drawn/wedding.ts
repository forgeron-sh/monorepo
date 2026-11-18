import type { PixelIcon } from "../types";

// Two interlocked rings, a stone in the secondary tone on the right one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wedding",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".......oo",
    "..####.oo",
    ".#....####",
    ".#...##...#",
    ".#...##...#",
    ".#...##...#",
    "..####....#",
    "......####",
  ],
};

export default icon;
