import type { PixelIcon } from "../types";

// Upload to the cloud: the outline of `cloud`, an arrow in the secondary tone rising through its
// base into the body, the base cut around the shaft (an arrow under the cloud read as a mushroom).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-upload",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....###",
    "....#...#",
    "..###....#",
    ".#...oo...#",
    "#...oooo...#",
    "#....oo....#",
    "#....oo....#",
    ".###.oo.###",
    ".....oo",
  ],
};

export default icon;
