// The header, the strip of days and the times as parts, with a confirm button under the list.
import {
  SlotPicker,
  SlotPickerBody,
  SlotPickerConfirm,
  SlotPickerDays,
  SlotPickerHeader,
  SlotPickerList,
  SlotPickerSummary,
  SlotPickerTimes,
  SlotPickerTitle,
  defaultWeekly,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <SlotPicker
      availability={{ timezone: "Europe/Paris", weekly: defaultWeekly(), exceptions: [] }}
      busy={[{ date: "2026-11-18", start: "10:00", end: "11:00" }]}
      duration={30}
      defaultDate="2026-11-18"
      now="2026-11-18T09:40"
      confirmLabel="Book"
      onConfirm={() => {}}
    >
      <SlotPickerHeader />
      <SlotPickerBody>
        <SlotPickerDays />
        <SlotPickerTimes>
          <SlotPickerTitle />
          <SlotPickerList />
          <SlotPickerSummary />
          <SlotPickerConfirm />
        </SlotPickerTimes>
      </SlotPickerBody>
    </SlotPicker>
  );
}
