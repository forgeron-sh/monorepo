import type { PixelIcon } from "../types";

// Leaving a geofence: an arrow in the secondary tone rising out of a ring on the ground.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "leaving-geo-fence",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "....oooo",
    "...oooooo",
    ".....oo",
    ".....oo",
    ".....oo",
    ".#...oo...#",
    "#....oo....#",
    "#..........#",
    ".##......##",
    "...######",
  ],
};

export default icon;
