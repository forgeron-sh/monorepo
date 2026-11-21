import type { PixelIcon } from "../types";

// Arrow pointing left away from a bar on the right, the bar in the secondary tone: `arrow-right-from-line` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-left-from-line",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...........o",
    "...........o",
    "....#......o",
    "...##......o",
    "..########.o",
    "..########.o",
    "...##......o",
    "....#......o",
    "...........o",
    "...........o",
  ],
};

export default icon;
