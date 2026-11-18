import { SizePicker } from "@forgeron/ui";

export default function Default() {
  return (
    <>
      <SizePicker defaultValue={3} />
      <SizePicker defaultValue={4} points={[0, 1, 2, 3, 5, 8]} />
    </>
  );
}
