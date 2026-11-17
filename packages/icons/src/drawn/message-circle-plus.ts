import type { PixelIcon } from "../types";

// Round speech bubble with a plus inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-circle-plus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##......##",
    "#....oo....#",
    "#..oooooo..#",
    "#....oo....#",
    ".##......##",
    "..#.######",
    "..#.#",
    "..##",
  ],
};

export default icon;
