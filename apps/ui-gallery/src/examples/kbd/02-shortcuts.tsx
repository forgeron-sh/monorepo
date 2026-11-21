import { Kbd } from "@forgeron/ui";

export default function Shortcuts() {
  return (
    <>
      <Kbd keys={["⌘", "K"]} />
      <Kbd keys={["⇧", "⌘", "P"]} />
      <Kbd keys="Esc" />
      <Kbd keys="/" />
    </>
  );
}
