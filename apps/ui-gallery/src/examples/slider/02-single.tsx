import { Slider } from "@forgeron/ui";
import { useState } from "react";

export default function Single() {
  const [volume, setVolume] = useState<number | readonly [number, number]>(40);
  return (
    <Slider
      label="Volume"
      showValue
      value={volume}
      onChange={setVolume}
      marks={[
        { value: 0, label: "0" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
      ]}
      formatValue={(n) => `${n}%`}
    />
  );
}
