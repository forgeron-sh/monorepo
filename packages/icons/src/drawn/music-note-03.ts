import type { PixelIcon } from "../types";

// Quarter note: the solid head and stem of `music-note-02`, without the flag.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "music-note-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......#",
    ".......#",
    ".......#",
    ".......#",
    ".......#",
    ".......#",
    ".......#",
    "....####",
    "...#####",
    "....###",
  ],
};

export default icon;
