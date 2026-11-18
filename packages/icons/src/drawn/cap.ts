import type { PixelIcon } from "../types";

// Cap: a baseball cap seen from the side, a round crown and a long peak to the right, the button in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cap",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....oo",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".###########",
    "..........##",
  ],
};

export default icon;
