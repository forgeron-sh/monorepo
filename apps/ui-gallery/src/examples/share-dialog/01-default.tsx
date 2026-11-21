import {
  Button,
  ShareDialog,
  ShareDialogFooter,
  ShareDialogHeader,
  ShareDialogPanel,
  SharePanelAdd,
  SharePanelGeneral,
  SharePanelLink,
  SharePanelPeople,
} from "@forgeron/ui";
import { useState } from "react";

const directory = [
  { id: "hb", name: "Hugo Bernard", hint: "Engineering" },
  { id: "np", name: "Nadia Petit", hint: "Finance" },
  { id: "team-ops", name: "Operations team", hint: "2 people" },
];

export default function Composed() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Share</Button>
      {open ? (
        <ShareDialog
          itemName="Dock plan.pdf"
          directory={directory}
          organization="Atelier Moreau"
          linkUrl="https://drive.example/s/abc"
          onCopyLink={() => {}}
          onClose={() => setOpen(false)}
        >
          <ShareDialogHeader />
          <ShareDialogPanel>
            <SharePanelAdd />
            <SharePanelPeople />
            <SharePanelGeneral>
              <SharePanelLink />
            </SharePanelGeneral>
          </ShareDialogPanel>
          <ShareDialogFooter />
        </ShareDialog>
      ) : null}
    </>
  );
}
