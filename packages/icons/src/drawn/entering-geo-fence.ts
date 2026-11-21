import type { PixelIcon } from "../types";

// Entering a geofence: an arrow crossing into a dashed circle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "entering-geo-fence",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..#......#",
    ".#........#",
    "......o",
    ".......o...#",
    "ooooooooo..#",
    ".......o...#",
    "......o....#",
    "",
    ".#........#",
    "..#......#",
    "....####",
  ],
};

export default icon;
