import type { PixelIcon } from "../types";

// Pillow: a soft square with its four corners pinched out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pillow",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "##........##",
    "#.########.#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "#.########.#",
    "##........##",
  ],
};

export default icon;
