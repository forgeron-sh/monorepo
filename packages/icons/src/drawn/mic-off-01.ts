import type { PixelIcon } from "../types";

// Microphone off: `mic-01` in one tone, struck by a 45° slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mic-off-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o...##",
    "..o.#..#",
    "...o...#",
    "..#.o..#.#",
    "..#.#o.#.#",
    "..#..#o..#",
    "...#...o",
    "....####o",
    ".....##..o",
    "...######.o",
    "...........o",
  ],
};

export default icon;
