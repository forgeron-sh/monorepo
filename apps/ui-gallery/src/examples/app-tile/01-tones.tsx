import { DashboardSquare01Icon, Folder01Icon, Mail01Icon, Task01Icon } from "@forgeron/icons";
import { AppTile } from "@forgeron/ui";

export default function Tones() {
  return (
    <>
      <AppTile icon={Task01Icon} size={20} label="Tasks" />
      <AppTile icon={Mail01Icon} label="Mail" />
      <AppTile icon={DashboardSquare01Icon} size={48} tone="ink" label="Workspace" />
      <AppTile icon={Folder01Icon} tone="neutral" label="Drive, not installed" />
    </>
  );
}
