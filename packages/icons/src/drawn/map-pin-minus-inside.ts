import type { PixelIcon } from "../types";

// Map pin with a minus inside: the larger shared pin, a round head and a pointed tip, with a minus centred in its head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "map-pin-minus-inside",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    "..#......#",
    ".#........#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
