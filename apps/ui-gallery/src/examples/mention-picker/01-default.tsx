import {
  MentionPicker,
  MentionPickerItem,
  MentionPickerList,
  type MentionOption,
} from "@forgeron/ui";
import { useState } from "react";

const records: MentionOption[] = [
  { id: "ops-40", label: "OPS-40", hint: "Closing" },
  { id: "ops-41", label: "OPS-41", hint: "Audit" },
];

export default function Composed() {
  const [active, setActive] = useState(0);
  return (
    <div style={{ width: 260 }}>
      <MentionPicker id="mp-parts" activeIndex={active} onActiveIndexChange={setActive} mark="#">
        <MentionPickerList label="Records">
          {records.map((option, index) => (
            <MentionPickerItem key={option.id} option={option} index={index} />
          ))}
        </MentionPickerList>
      </MentionPicker>
    </div>
  );
}
