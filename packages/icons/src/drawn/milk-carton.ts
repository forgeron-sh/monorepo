import type { PixelIcon } from "../types";

// Milk carton in perspective: a fin on the gable, the front and side panels, a label band in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "milk-carton",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#####",
    "...#...#.#",
    "..#...#...#",
    "..#####...#",
    "..#...#...#",
    "..#ooo#...#",
    "..#...#...#",
    "..#...#...#",
    "..#...#..#",
    "..#####.#",
  ],
};

export default icon;
