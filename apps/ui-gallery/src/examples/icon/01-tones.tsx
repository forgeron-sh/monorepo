import { CloudIcon, Mail01Icon, Search01Icon, Settings01Icon, Upload01Icon } from "@forgeron/icons";
import { Icon } from "@forgeron/ui";

export default function Tones() {
  return (
    <>
      <Icon icon={Upload01Icon} />
      <Icon icon={CloudIcon} />
      <Icon icon={Mail01Icon} />
      <Icon icon={Search01Icon} variant="mono" />
      <Icon icon={Settings01Icon} variant="mono" />
    </>
  );
}
