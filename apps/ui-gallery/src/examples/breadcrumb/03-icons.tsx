import { Folder01Icon, Home01Icon } from "@forgeron/icons";
import { Breadcrumb } from "@forgeron/ui";

export default function Icons() {
  return (
    <Breadcrumb
      items={[
        { label: "Drive", href: "#drive", icon: Home01Icon },
        { label: "Clients", href: "#clients", icon: Folder01Icon },
        { label: "Atelier Moreau — contract 2026.pdf" },
      ]}
    />
  );
}
