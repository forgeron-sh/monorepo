import type { PixelIcon } from "../types";

// List with a return arrow on its last line: add at the end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-end",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "",
    "",
    ".######...o",
    "..........o",
    ".......o..o",
    ".####.ooooo",
    ".......o",
  ],
};

export default icon;
