import type { PixelIcon } from "../types";

// Numbered list: the digits 1 and 2 in the secondary tone, each beside a long and a short line,
// laid out like task-01 so the list family stays consistent.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "left-to-right-list-number",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o",
    ".oo..######",
    "..o",
    ".ooo..####",
    "",
    "",
    ".oo",
    "...o.######",
    "..o",
    ".ooo..####",
  ],
};

export default icon;
