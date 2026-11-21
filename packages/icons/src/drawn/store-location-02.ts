import type { PixelIcon } from "../types";

// A shop front with an awning and a location pin badge. Base from `store-01`, the awning in the primary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "store-location-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    "..##.##.##",
    "..#......#",
    "..#.##",
    "..#.##..ooo",
    "..#....oo.oo",
    "..#....ooooo",
    ".#####..ooo",
    ".........o",
  ],
};

export default icon;
