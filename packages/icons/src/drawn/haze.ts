import type { PixelIcon } from "../types";

// Haze: half a sun with rays over two haze bands in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "haze",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".#...##...#",
    "..#......#",
    "....####",
    "##.#....#.##",
    "..#......#",
    "",
    ".oooooooooo",
    "",
    "..oooooooo",
  ],
};

export default icon;
