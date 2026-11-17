import type { PixelIcon } from "../types";

// Configuration: two switches, the upper one on with its knob in the secondary tone, the lower one off.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "configuration-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#.....oo.#",
    ".#.....oo.#",
    "..########",
    "",
    "",
    "..########",
    ".#.##.....#",
    ".#.##.....#",
    "..########",
  ],
};

export default icon;
