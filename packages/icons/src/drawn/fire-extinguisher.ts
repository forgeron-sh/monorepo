import type { PixelIcon } from "../types";

// Fire extinguisher: a tank with a valve on top and its hose in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fire-extinguisher",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####oo",
    "....#...o",
    "...###..o",
    "..#...#.o",
    "..#...#.o",
    "..#...#.oo",
    "..#...#",
    "..#...#",
    "..#...#",
    "..#####",
  ],
};

export default icon;
