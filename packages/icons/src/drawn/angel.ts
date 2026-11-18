import type { PixelIcon } from "../types";

// Angel: a halo in the secondary tone over a head, a widening robe and two raised wings.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "angel",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oooo",
    "",
    ".....##",
    "#....##....#",
    "##........##",
    "###.####.###",
    "####.##.####",
    ".##.####.##",
    "...######",
    "...######",
    "..########",
    "..########",
  ],
};

export default icon;
