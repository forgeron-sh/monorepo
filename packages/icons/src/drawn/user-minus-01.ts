import type { PixelIcon } from "../types";

// Person with a wide minus badge in the lower corner (`user-remove-01` puts a short one at the top).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-minus-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#",
    "....##",
    "",
    "..###",
    ".#",
    ".#....ooooo",
    ".#",
    ".####",
  ],
};

export default icon;
