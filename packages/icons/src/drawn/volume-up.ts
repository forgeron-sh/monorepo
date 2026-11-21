import type { PixelIcon } from "../types";

// Speaker with a plus in the secondary tone, to turn the volume up.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "volume-up",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......#",
    ".....##",
    "..###.#..o",
    "..#...#..o",
    "..#...#ooooo",
    "..###.#..o",
    ".....##..o",
    "......#",
  ],
};

export default icon;
