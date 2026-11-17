import type { PixelIcon } from "../types";

// Monitor showing a small video camera, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-video-call",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.ooo..o.#",
    ".#.ooo.oo.#",
    ".#.ooo.oo.#",
    ".#.ooo..o.#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
