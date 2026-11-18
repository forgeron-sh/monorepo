import { AnvilIcon } from "@forgeron/icons";
import { Icon } from "@forgeron/ui";

export default function Sizes() {
  return (
    <>
      <Icon icon={AnvilIcon} size={12} />
      <Icon icon={AnvilIcon} size={24} />
      <Icon icon={AnvilIcon} size={48} title="Forgeron" />
    </>
  );
}
