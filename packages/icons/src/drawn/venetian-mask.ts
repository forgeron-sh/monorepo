import type { PixelIcon } from "../types";

// Venetian eye mask: solid band with two eye holes and a nose notch.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "venetian-mask",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "##........##",
    "####....####",
    "############",
    "###..##..###",
    "###..##..###",
    ".##########",
    "..###..###",
  ],
};

export default icon;
