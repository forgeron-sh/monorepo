import type { PixelIcon } from "../types";

// A shop front with an awning and a check badge. Base from `store-01`, the awning in the primary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "store-verified-02",
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
    "..#.##.....o",
    "..#.......o",
    "..#....o.o",
    ".#####..o",
  ],
};

export default icon;
