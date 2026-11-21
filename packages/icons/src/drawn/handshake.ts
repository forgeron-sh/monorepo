import type { PixelIcon } from "../types";

// Handshake: two hands clasped along a diagonal seam between a cuff on each side, the fingers of one under the other.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "handshake",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "#.####.....#",
    "#.#####.##.#",
    "#.####.###.#",
    "#.###.####.#",
    "#....#####.#",
    "......#.#",
  ],
};

export default icon;
