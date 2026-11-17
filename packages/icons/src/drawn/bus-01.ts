import type { PixelIcon } from "../types";

// Bus seen from the front: a large windscreen, the headlights in the secondary tone, two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bus-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".##########",
    ".#........#",
    ".#oo....oo#",
    ".#........#",
    ".##########",
    ".##......##",
    ".##......##",
  ],
};

export default icon;
