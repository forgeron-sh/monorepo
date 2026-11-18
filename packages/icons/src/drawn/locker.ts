import type { PixelIcon } from "../types";

// Locker: a tall door with two vents and a handle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "locker",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#....o.#",
    "..#....o.#",
    "..#......#",
    "..########",
  ],
};

export default icon;
