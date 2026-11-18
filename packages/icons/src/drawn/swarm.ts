import type { PixelIcon } from "../types";

// The Swarm (by Foursquare) mark in pixels: the bee seen from the side, its large wing on the
// upper left and the small upright wing beside it, the curved body in two stripes (the outer
// crescent and the inner bean) and the sting below on the left.
// 12×12: `#` primary tone. Drawn on 2026-11-18. Rasterised from the reference
// `simple-icons:swarm` (Iconify, 2026-11-18) at cell centres, then redrawn by hand. Swarm and
// the Swarm logo are trademarks of Foursquare Labs, Inc., used here only to refer to Swarm.
const icon: PixelIcon = {
  name: "swarm",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##.....##",
    "#####..##",
    "######.#",
    ".#####",
    "......##.##",
    ".....##.####",
    ".....##.####",
    "....###.####",
    "...#.###.##",
    "..##..###",
  ],
};

export default icon;
