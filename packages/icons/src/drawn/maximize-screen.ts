import type { PixelIcon } from "../types";

// Screen on a stand with four corners pointing outwards in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maximize-screen",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.oo..oo.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#.oo..oo.#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
