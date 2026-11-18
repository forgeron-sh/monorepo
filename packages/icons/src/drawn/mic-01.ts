import type { PixelIcon } from "../types";

// Microphone: a capsule in a U-shaped holder, a stem and a base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the capsule.
const icon: PixelIcon = {
  name: "mic-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....o..o",
    "....o..o",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#..oo..#",
    "...#....#",
    "....####",
    ".....##",
    "...######",
  ],
};

export default icon;
