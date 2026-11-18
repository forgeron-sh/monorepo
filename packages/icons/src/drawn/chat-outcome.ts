import type { PixelIcon } from "../types";

// Chat: a speech bubble, an outgoing arrow in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-outcome",
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
    ".##.....ooo",
    "..#.#....oo",
    "..#.#...o.o",
    "..##...o",
    "......o",
  ],
};

export default icon;
