import type { PixelIcon } from "../types";

// Cylinder of `cylinder-01` with its radius drawn on the top face in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cylinder-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##..oooo##",
    ".#.######.#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##......##",
    "...######",
  ],
};

export default icon;
