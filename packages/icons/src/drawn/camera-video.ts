import type { PixelIcon } from "../types";

// Film camera: two reels on top of a body, the lens cone in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-video",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".###.###",
    ".#.#.#.#",
    ".###.###",
    ".#######..o",
    ".#.....#.oo",
    ".#.....#ooo",
    ".#.....#.oo",
    ".#######..o",
  ],
};

export default icon;
