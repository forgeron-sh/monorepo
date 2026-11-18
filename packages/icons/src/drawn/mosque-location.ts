import type { PixelIcon } from "../types";

// Mosque location: the shared map pin with a dome in the secondary tone in its head.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mosque-location",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "..#..oo..#",
    "..#.oooo.#",
    "..#.oooo.#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
