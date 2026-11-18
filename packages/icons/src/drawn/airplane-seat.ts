import type { PixelIcon } from "../types";

// Airplane seat: a seat in profile, tall back, pedestal, armrest in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "airplane-seat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    "..#.#",
    "..#.#",
    "..#.#oooo",
    "..#.#",
    "..#.######",
    "..#......#",
    "..########",
    "......#",
    "....#####",
  ],
};

export default icon;
