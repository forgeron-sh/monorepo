import type { PixelIcon } from "../types";

// OK hand sign: three raised fingers, the thumb and index finger closed into a ring in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ok-finger",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......###",
    ".......#.###",
    ".....###.#.#",
    ".....#.#.#.#",
    ".oo..#.#.#.#",
    "o..o.#.....#",
    "o..oo......#",
    ".oo.#......#",
    "....#.....#",
    ".....#...#",
    ".....#####",
  ],
};

export default icon;
