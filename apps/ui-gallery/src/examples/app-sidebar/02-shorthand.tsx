import { Folder01Icon, InboxIcon, Layers01Icon, Tick01Icon, UserCircleIcon } from "@forgeron/icons";
import { AppSidebar } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [current, setCurrent] = useState("#/inbox");
  return (
    <div style={{ width: 220, height: 230 }}>
      <AppSidebar
        app={{ name: "Tasks", icon: Tick01Icon }}
        current={current}
        onNavigate={(href, event) => {
          event.preventDefault();
          setCurrent(href);
        }}
        items={[
          { href: "#/inbox", label: "Inbox", icon: InboxIcon, count: 4 },
          { href: "#/my", label: "My issues", icon: UserCircleIcon },
        ]}
        sections={[
          {
            label: "Workspace",
            items: [
              { href: "#/projects", label: "Projects", icon: Folder01Icon },
              { href: "#/views", label: "Views", icon: Layers01Icon },
            ],
          },
        ]}
      />
    </div>
  );
}
