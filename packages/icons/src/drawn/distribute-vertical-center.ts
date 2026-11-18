import type { PixelIcon } from "../types";

// Two boxes stacked, a guide through the centre of each.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "distribute-vertical-center",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    ".oo#oooo#oo",
    "...######",
    "",
    "",
    "..########",
    ".o#oooooo#o",
    "..########",
  ],
};

export default icon;
