import type { PixelIcon } from "../types";

// Clock of `clock-01` with the cog badge of `calendar-cog` in the secondary tone: time settings.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "time-setting-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...#....#",
    ".#...#....#",
    ".#...###..#",
    ".#",
    ".#......o.o",
    ".#.....ooooo",
    "..#....oo.oo",
    "...###.ooooo",
    "........o.o",
  ],
};

export default icon;
