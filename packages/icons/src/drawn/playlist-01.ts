import type { PixelIcon } from "../types";

// Playlist: three lines of decreasing length and a note in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "playlist-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".######..o",
    ".........oo",
    ".........oo",
    ".######..o",
    ".........o",
    ".........o",
    ".####..ooo",
    ".......oo",
  ],
};

export default icon;
