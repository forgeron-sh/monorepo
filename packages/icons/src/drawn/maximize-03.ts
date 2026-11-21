import type { PixelIcon } from "../types";

// Maximise: four corner brackets marking the full frame.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maximize-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#........#",
    "",
    "",
    "",
    "",
    ".#........#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
