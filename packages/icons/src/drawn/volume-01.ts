import type { PixelIcon } from "../types";

// Speaker on its own: the loudspeaker of the volume icons.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "volume-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......#",
    "......##",
    "...###.#",
    "...#...#",
    "...#...#",
    "...###.#",
    "......##",
    ".......#",
  ],
};

export default icon;
