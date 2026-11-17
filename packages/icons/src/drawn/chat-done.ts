import type { PixelIcon } from "../types";

// Chat: a speech bubble, a check mark in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-done",
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
    ".##.......o",
    "..#.#....o",
    "..#.#.o.o",
    "..##...o",
  ],
};

export default icon;
