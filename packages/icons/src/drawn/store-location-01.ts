import type { PixelIcon } from "../types";

// A shop front with a location pin badge. Base from `store-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "store-location-01",
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
    "..#.....ooo",
    "..#....oo.oo",
    "..#....ooooo",
    ".#####..ooo",
    ".........o",
  ],
};

export default icon;
