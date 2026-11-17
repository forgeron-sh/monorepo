import type { PixelIcon } from "../types";

// A shop front with a plus badge. Base from `store-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "store-add-01",
  implemented: true,
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
    "..#......o",
    "..#......o",
    "..#....ooooo",
    ".#####...o",
    ".........o",
  ],
};

export default icon;
