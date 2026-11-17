import type { PixelIcon } from "../types";

// List with a return arrow on its first line: add at the start.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-start",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......o",
    ".####.ooooo",
    ".......o..o",
    "..........o",
    ".######...o",
    "",
    "",
    ".##########",
  ],
};

export default icon;
