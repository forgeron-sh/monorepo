import type { PixelIcon } from "../types";

// Rolling pin: a barrel with a handle at each end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rolling-pin",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "..########",
    "###......###",
    "###......###",
    "..########",
  ],
};

export default icon;
