import { Add01Icon } from "@forgeron/icons";
import { IconButton } from "@forgeron/ui";

export default function Sizes() {
  return (
    <>
      <IconButton icon={Add01Icon} label="New issue" size="sm" variant="boxed" />
      <IconButton icon={Add01Icon} label="New issue" variant="boxed" />
      <IconButton icon={Add01Icon} label="New issue" disabled />
    </>
  );
}
