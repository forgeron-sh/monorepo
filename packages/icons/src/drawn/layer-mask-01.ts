import type { PixelIcon } from "../types";

// Square layer with a round mask inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layer-mask-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
