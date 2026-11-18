import type { PixelIcon } from "../types";

// The Litecoin mark: an L crossed by a rising stroke, in the full-grid ring of `bitcoin-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "litecoin",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#...oo...#",
    "#....oo....#",
    "#....oooo..#",
    "#..oooo....#",
    "#....oo....#",
    ".#...oo...#",
    ".#...oooo.#",
    "..##....##",
    "....####",
  ],
};

export default icon;
