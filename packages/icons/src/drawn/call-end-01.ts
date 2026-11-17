import type { PixelIcon } from "../types";

// Hang up: a handset lying upside down, a domed grip on two solid earpieces, centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-end-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "...######",
    ".##########",
    "###......###",
    "###......###",
  ],
};

export default icon;
