import type { PixelIcon } from "../types";

// Vibrate: a phone between two short strokes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "vibrate",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    ".o.#....#.o",
    ".o.#....#.o",
    ".o.#....#.o",
    ".o.#....#.o",
    ".o.#....#.o",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
