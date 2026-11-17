import type { PixelIcon } from "../types";

// Two cards swapping places, two curved arrows between them in the secondary tone; symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "card-exchange-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######.o",
    ".#.....#..o",
    ".#######..o",
    ".#######.ooo",
    "..........o",
    ".o",
    "ooo.#######",
    ".o..#######",
    ".o..#.....#",
    "..o.#######",
  ],
};

export default icon;
