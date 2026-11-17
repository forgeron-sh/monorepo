import type { PixelIcon } from "../types";

// Traffic jam: a car seen from the front with a second car queued behind it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "traffic-jam-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...oooooo",
    "..o......o",
    ".o........o",
    "...######",
    "..#......#",
    ".##########",
    ".###....###",
    ".#........#",
    ".##########",
    ".##......##",
    ".##......##",
  ],
};

export default icon;
