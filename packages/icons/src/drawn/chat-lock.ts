import type { PixelIcon } from "../types";

// Round speech bubble (`chat`) with a padlock badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-lock",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##......##",
    "#..........#",
    "#..........#",
    "#",
    ".##....ooo",
    "..#.#..o.o",
    "..#.#.ooooo",
    "..##..ooooo",
    "......ooooo",
  ],
};

export default icon;
