import type { PixelIcon } from "../types";

// Speaker struck by a cross in the secondary tone: the speaker of `volume-high`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "volume-mute-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....#",
    "....##",
    ".###.#.o..o",
    ".#...#..oo",
    ".#...#..oo",
    ".###.#.o..o",
    "....##",
    ".....#",
  ],
};

export default icon;
