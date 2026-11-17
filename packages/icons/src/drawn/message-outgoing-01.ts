import type { PixelIcon } from "../types";

// Speech bubble with an arrow pointing out to the upper right, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-outgoing-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#....ooo.#",
    ".#.....oo.#",
    ".#....o.o.#",
    ".#...o....#",
    ".#..o.....#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
