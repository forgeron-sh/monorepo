import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`log`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "log",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    "o.###.##.#",
    "",
    "#.##.####",
    "",
    "oooooooooooo",
    "o#o###o##ooo",
    "oooooooooooo",
    "",
    "#.###.#.##",
    "",
    "#.#.##",
  ],
};

export default icon;
