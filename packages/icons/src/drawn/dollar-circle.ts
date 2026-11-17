import type { PixelIcon } from "../types";

// Dollar sign in a ring: the full-grid ring of `circle` and an S with two-pixel uprights, its middle
// stepping across, symmetric by a half turn, with the two ends of the bar above and below; the sign
// in the secondary tone (redrawn on 2026-11-17: the first version crammed a one-pixel S and a
// two-pixel bar into the small ring of `clock-01` and read as noise).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dollar-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#..ooooo.#",
    "#..oo......#",
    "#...ooo....#",
    "#....ooo...#",
    "#......oo..#",
    ".#.ooooo..#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
