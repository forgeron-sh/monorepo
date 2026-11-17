import type { PixelIcon } from "../types";

// Chart in a frame: two bars, short and tall, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.....oo.#",
    ".#.....oo.#",
    ".#.....oo.#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
