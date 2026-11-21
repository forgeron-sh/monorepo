import type { PixelIcon } from "../types";

// Chat: a speech bubble, a blocked sign in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-blocked",
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
    "..#.#.o..oo",
    "..#.#.o.o.o",
    "..##..oo..o",
    ".......ooo",
  ],
};

export default icon;
