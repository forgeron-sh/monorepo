import { Briefcase01Icon, Home01Icon } from "@forgeron/icons";
import {
  Button,
  MoveDialog,
  MoveDialogHeader,
  MoveDialogPanel,
  MovePanelConfirm,
  MovePanelFooter,
  MovePanelFrom,
  MovePanelTo,
  MovePanelTree,
  type FolderNode,
} from "@forgeron/ui";
import { useState } from "react";

const folders: FolderNode[] = [
  {
    id: "my",
    name: "My files",
    icon: Home01Icon,
    children: [
      { id: "contracts", name: "Contracts", children: [] },
      { id: "photos", name: "Photos", children: [] },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    icon: Briefcase01Icon,
    children: [{ id: "quotes", name: "Quotes", children: [] }],
  },
];

export default function Composed() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Move 3 items</Button>
      {open ? (
        <MoveDialog
          itemLabel="3 items"
          folders={folders}
          from="My files"
          disabledIds={["my"]}
          defaultValue="contracts"
          onConfirm={() => {}}
          onClose={() => setOpen(false)}
        >
          <MoveDialogHeader />
          <MoveDialogPanel>
            <MovePanelFrom />
            <MovePanelTree />
            <MovePanelFooter>
              <MovePanelTo />
              <MovePanelConfirm />
            </MovePanelFooter>
          </MoveDialogPanel>
        </MoveDialog>
      ) : null}
    </>
  );
}
