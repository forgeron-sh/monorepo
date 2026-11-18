import type { PixelIcon } from "../types";

// Lines of text inside a dashed frame.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "text-select",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oo..oo..oo",
    ".o........o",
    "",
    "...######",
    "",
    ".o........o",
    ".o..####..o",
    "",
    "",
    ".o........o",
    ".oo..oo..oo",
  ],
};

export default icon;
