import type { PixelIcon } from "../types";

// Video camera in the secondary tone inside a rounded square: the Zoom app mark, drawn generically.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zoom-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#.oooo.o.#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#.oooo.o.#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
