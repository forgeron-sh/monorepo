import type { PixelIcon } from "../types";

// Chat: a speech bubble, a spark in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-spark",
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
    "..#.#..ooo",
    "..#.#.ooooo",
    "..##...ooo",
    "........o",
  ],
};

export default icon;
