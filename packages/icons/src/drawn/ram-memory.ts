import type { PixelIcon } from "../types";

// Memory module: a board with two chips in the secondary tone and the key notch.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ram-memory",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "############",
    "#..........#",
    "#.ooo..ooo.#",
    "#.ooo..ooo.#",
    "#..........#",
    "####.#######",
  ],
};

export default icon;
