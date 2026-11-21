import type { PixelIcon } from "../types";

// Meeting room: a long table seen from above, two chairs on each side in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "meeting-room",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    ".o.#....#.o",
    ".o.#....#.o",
    "...#....#",
    "...#....#",
    ".o.#....#.o",
    ".o.#....#.o",
    "...######",
  ],
};

export default icon;
