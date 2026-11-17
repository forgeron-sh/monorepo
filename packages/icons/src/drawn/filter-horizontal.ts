import type { PixelIcon } from "../types";

// Filter: three centred lines getting shorter, like a funnel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
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
