import type { PixelIcon } from "../types";

// The Groww mark: a disc split by a rising line, the upper part in the primary tone and the lower
// part in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "groww",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    ".##########",
    ".##########",
    "##########.o",
    "#########.oo",
    "########.ooo",
    "######.#.ooo",
    "##.##.o.oooo",
    "#.#..oooooo",
    ".ooooooooo",
    ".oooooooooo",
    "...oooooo",
  ],
};

export default icon;
