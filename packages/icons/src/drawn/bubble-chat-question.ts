import type { PixelIcon } from "../types";

// Round speech bubble with a question-mark badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bubble-chat-question",
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
    "..#.#.....o",
    "..#.#...oo",
    "..##",
    "........o",
  ],
};

export default icon;
