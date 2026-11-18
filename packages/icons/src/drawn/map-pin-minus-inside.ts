import type { PixelIcon } from "../types";

// An odd-width map pin with a minus centred in its head in thin one-pixel strokes, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "map-pin-minus-inside",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#####",
    ".##.....##",
    ".#.......#",
    "#.........#",
    "#..ooooo..#",
    "#.........#",
    ".#.......#",
    "..#.....#",
    "...#...#",
    "....#.#",
    ".....#",
  ],
};

export default icon;
