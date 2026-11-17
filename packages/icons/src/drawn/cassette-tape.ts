import type { PixelIcon } from "../types";

// Audio cassette: two reels joined by the tape in the secondary tone, the tape guide tab below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cassette-tape",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oooooo.#",
    ".#........#",
    ".##########",
    "..#......#",
    "...######",
  ],
};

export default icon;
