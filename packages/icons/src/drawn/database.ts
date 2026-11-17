import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`database`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "database",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##......##",
    ".#.######.#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.######.#",
    ".#........#",
    ".##......##",
    "...######",
  ],
};

export default icon;
