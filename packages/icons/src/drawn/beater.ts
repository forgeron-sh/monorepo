import type { PixelIcon } from "../types";

// Beater: a whisk: a loop of wires on a hollow handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "beater",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#####",
    "..#..#..#",
    "..#..#..#",
    "..#..#..#",
    "..#..#..#",
    "...#.#.#",
    "....###",
    "....o.o",
    "....o.o",
    "....o.o",
    "....o.o",
    "....ooo",
  ],
};

export default icon;
