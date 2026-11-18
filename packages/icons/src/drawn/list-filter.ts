import type { PixelIcon } from "../types";

// List filter: three centred lines getting shorter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-filter",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "",
    "",
    "...######",
    "",
    "",
    ".....##",
  ],
};

export default icon;
