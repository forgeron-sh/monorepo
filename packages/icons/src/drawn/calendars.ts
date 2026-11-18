import type { PixelIcon } from "../types";

// Two calendars, one behind the other; the front one marks a day in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendars",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...########",
    "...#......#",
    ".########.#",
    ".########.#",
    ".#......#.#",
    ".#..oo..#.#",
    ".#..oo..#.#",
    ".#......###",
    ".########",
  ],
};

export default icon;
