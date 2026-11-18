import type { PixelIcon } from "../types";

// Pickup truck carrying a crate: the truck of `pickup-01`, the crate in its bed in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pickup-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....####",
    ".ooo.#..##",
    "#ooo.#...##",
    "############",
    "#..........#",
    "############",
    ".###....###",
    ".###....###",
  ],
};

export default icon;
