import type { PixelIcon } from "../types";

// Speech bubble with a person badge in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-user",
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
    "..#.#..ooo",
    "..##",
    "......ooooo",
  ],
};

export default icon;
