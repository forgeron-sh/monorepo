import type { PixelIcon } from "../types";

// Round speech bubble with three dots, the dots in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##......##",
    "#..........#",
    "#.oo.oo.oo.#",
    "#..........#",
    ".##......##",
    "..#.######",
    "..#.#",
    "..##",
  ],
};

export default icon;
