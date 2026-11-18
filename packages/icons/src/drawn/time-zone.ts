import type { PixelIcon } from "../types";

// A globe with a clock: a time zone. Globe of `globe-lock`, clock of `user-time-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "time-zone",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..###..###",
    "..#.#..#.#",
    ".#..#..#..#",
    ".##########",
    ".#####",
    ".#..#...ooo",
    "..#.#..o.o.o",
    "..###..o.ooo",
    "....##.o...o",
    "........ooo",
  ],
};

export default icon;
