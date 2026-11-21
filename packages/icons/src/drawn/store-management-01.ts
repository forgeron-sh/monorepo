import type { PixelIcon } from "../types";

// A shop front with a cog badge. Base from `store-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "store-management-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    "..#......#",
    "..#.##...#",
    "..#.##",
    "..#....o.o.o",
    "..#.....ooo",
    "..#....oo.oo",
    ".#####..ooo",
    ".......o.o.o",
  ],
};

export default icon;
