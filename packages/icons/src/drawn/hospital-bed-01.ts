import type { PixelIcon } from "../types";

// Hospital bed: a headboard, a person lying down in the secondary tone, the mattress, the footboard and the legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hospital-bed-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "#",
    "#.oo",
    "#.oo.oooooo",
    "#..........#",
    "############",
    "#..........#",
    "#..........#",
  ],
};

export default icon;
