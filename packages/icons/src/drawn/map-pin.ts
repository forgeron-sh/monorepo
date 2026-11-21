import type { PixelIcon } from "../types";

// Map pin: the shared outline pin with a dot in its head, standing on a ground arc in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "map-pin",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "..#..##..#",
    "..#..##..#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    "",
    "..oo....oo",
    "....oooo",
  ],
};

export default icon;
