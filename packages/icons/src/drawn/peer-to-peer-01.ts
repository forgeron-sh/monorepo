import type { PixelIcon } from "../types";

// Peer to peer: two screens side by side, a two-way arrow between them in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "peer-to-peer-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#####..#####",
    "#...#..#...#",
    "#...#..#...#",
    "#####..#####",
    "..#......#",
    ".###....###",
    "",
    ".o........o",
    "oooooooooooo",
    ".o........o",
  ],
};

export default icon;
