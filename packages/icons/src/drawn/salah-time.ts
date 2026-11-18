import type { PixelIcon } from "../types";

// Prayer time: the clock of `clock-check` with a crescent badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "salah-time",
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
    ".#.###",
    ".#.......ooo",
    ".#......oo",
    ".#......o",
    "..#.....oo",
    "...##....ooo",
  ],
};

export default icon;
