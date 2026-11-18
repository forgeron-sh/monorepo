import type { PixelIcon } from "../types";

// Square speech bubble, cut at the lower right for a blocked sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-blocked",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#.....ooo",
    "..#...o..oo",
    "..#.#.o.o.o",
    "..##..oo..o",
    ".......ooo",
  ],
};

export default icon;
