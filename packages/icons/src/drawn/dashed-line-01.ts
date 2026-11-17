import type { PixelIcon } from "../types";

// A solid line over a dashed line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashed-line-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    ".##########",
    "",
    "",
    ".oo..oo..oo",
  ],
};

export default icon;
