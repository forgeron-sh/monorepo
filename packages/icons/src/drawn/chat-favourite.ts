import type { PixelIcon } from "../types";

// Chat: a speech bubble, a star in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-favourite",
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
    ".##.....o",
    "..#.#.ooooo",
    "..#.#..ooo",
    "..##...ooo",
    "......o...o",
  ],
};

export default icon;
