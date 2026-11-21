import type { PixelIcon } from "../types";

// Chat: a speech bubble, a clock in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-delay",
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
    "..#.#.o.o.o",
    "..#.#.o.ooo",
    "..##..o...o",
    ".......ooo",
  ],
};

export default icon;
