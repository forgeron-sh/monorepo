import type { PixelIcon } from "../types";

// The Zoom mark: a video camera in a full-grid rounded square, the camera in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "zoom",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "#..........#",
    "#..........#",
    "#.ooooo..o.#",
    "#.ooooo.oo.#",
    "#.ooooo.oo.#",
    "#.ooooo..o.#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
