import type { PixelIcon } from "../types";

// A scroll anchor: a centre dot with four arrowheads pointing to the corners.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "diagonal-scroll-point-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".##......##",
    ".#.#....#.#",
    "",
    ".....oo",
    ".....oo",
    "",
    ".#.#....#.#",
    ".##......##",
    ".###....###",
  ],
};

export default icon;
