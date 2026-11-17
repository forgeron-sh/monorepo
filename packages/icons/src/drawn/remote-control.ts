import type { PixelIcon } from "../types";

// Remote control: a tall narrow body, a big button on top in the secondary tone and two rows of keys.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "remote-control",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...#.oo.#",
    "...#.oo.#",
    "...#....#",
    "...#.##.#",
    "...#....#",
    "...#.##.#",
    "...#....#",
    "...######",
  ],
};

export default icon;
