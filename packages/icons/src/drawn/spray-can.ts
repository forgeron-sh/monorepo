import type { PixelIcon } from "../types";

// Spray can: a nozzle on a can, spray in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "spray-can",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........o",
    "....##...o",
    "....###.ooo",
    "....##...o",
    "...####...o",
    "..#....#",
    "..#....#",
    "..#....#",
    "..#....#",
    "..#....#",
    "..######",
  ],
};

export default icon;
