import type { PixelIcon } from "../types";

// Jerrycan: a handle, a spout, a body with an X embossed in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fuel",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###...#",
    "...#.#..#",
    "..#######",
    "..#.....#",
    "..#.....#",
    "..#.o.o.#",
    "..#..o..#",
    "..#.o.o.#",
    "..#.....#",
    "..#######",
  ],
};

export default icon;
