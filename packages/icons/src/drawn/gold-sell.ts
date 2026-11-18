import type { PixelIcon } from "../types";

// Gold sell: the ingots of `gold-ingots` with a minus badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gold-sell",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....####",
    "...#....#",
    "...######",
    "",
    ".####",
    "#....#",
    "######.ooooo",
  ],
};

export default icon;
