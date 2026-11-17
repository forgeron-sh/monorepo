import type { PixelIcon } from "../types";

// A shop front with an awning and a cog badge. Base from `store-01`, the awning in the primary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "store-management-02",
  implemented: true,
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
    "..#.##.o.o.o",
    "..#.....ooo",
    "..#....oo.oo",
    ".#####..ooo",
    ".......o.o.o",
  ],
};

export default icon;
