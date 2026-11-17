import type { PixelIcon } from "../types";

// VR headset: the goggles from the front with a nose cut and strap stubs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "virtual-reality-vr-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..########",
    ".#........#",
    "##........##",
    "##........##",
    ".#...##...#",
    "..###..###",
  ],
};

export default icon;
