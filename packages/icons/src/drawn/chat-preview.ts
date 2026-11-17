import type { PixelIcon } from "../types";

// Chat preview: a speech bubble with an eye inside, the eye in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-preview",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##......##",
    "#...oooo...#",
    "#..o.oo.o..#",
    "#...oooo...#",
    ".##......##",
    "..#.######",
    "..#.#",
    "..##",
  ],
};

export default icon;
