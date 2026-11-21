import type { CpuSource } from "../contract";
import type { ConstantParams } from "./constant";

export const constantCpu: CpuSource<ConstantParams> = {
  type: "constant",
  cpu(frame, p) {
    const { data } = frame;
    for (let o = 0; o < data.length; o += 4) {
      data[o] = p.value;
      data[o + 1] = 0;
      data[o + 2] = 0;
      data[o + 3] = 1;
    }
  },
};
