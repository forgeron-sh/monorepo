import type { PixelIcon } from "../types";

// Apartment block: six windows in the secondary tone on three floors, and a door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "apartment",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.oo..oo.#",
    ".#........#",
    ".#.oo..oo.#",
    ".#........#",
    ".#.oo..oo.#",
    ".#........#",
    ".#...##...#",
    ".##########",
  ],
};

export default icon;
