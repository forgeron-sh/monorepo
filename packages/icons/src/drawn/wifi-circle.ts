import type { PixelIcon } from "../types";

// Small Wi-Fi in the secondary tone inside a circle. Built on `bluetooth-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..oooo..#",
    "#..o....o..#",
    "#..........#",
    "#...oooo...#",
    "#..........#",
    ".#...oo...#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
