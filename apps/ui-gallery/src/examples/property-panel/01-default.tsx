// Composed from parts: groups under a heading, a list of rows, each a label and its value.
import {
  DatePicker,
  PersonPicker,
  PriorityPicker,
  PropertyPanel,
  PropertyPanelGroup,
  PropertyPanelHeading,
  PropertyPanelLabel,
  PropertyPanelList,
  PropertyPanelRow,
  PropertyPanelValue,
  PropertyText,
  StatusPicker,
} from "@forgeron/ui";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
];

export default function Composed() {
  return (
    <div style={{ width: 240 }}>
      <PropertyPanel>
        <PropertyPanelGroup>
          <PropertyPanelHeading>Properties</PropertyPanelHeading>
          <PropertyPanelList>
            <PropertyPanelRow>
              <PropertyPanelLabel>Status</PropertyPanelLabel>
              <PropertyPanelValue>
                <StatusPicker defaultValue="review" />
              </PropertyPanelValue>
            </PropertyPanelRow>
            <PropertyPanelRow>
              <PropertyPanelLabel>Priority</PropertyPanelLabel>
              <PropertyPanelValue>
                <PriorityPicker defaultValue={1} />
              </PropertyPanelValue>
            </PropertyPanelRow>
            <PropertyPanelRow>
              <PropertyPanelLabel>Assignee</PropertyPanelLabel>
              <PropertyPanelValue>
                <PersonPicker people={people} me="cr" noneLabel="No assignee" defaultValue="hb" />
              </PropertyPanelValue>
            </PropertyPanelRow>
            <PropertyPanelRow>
              <PropertyPanelLabel>Due date</PropertyPanelLabel>
              <PropertyPanelValue>
                <DatePicker label="Due date" today="2026-11-17" defaultValue="2026-11-18" />
              </PropertyPanelValue>
            </PropertyPanelRow>
          </PropertyPanelList>
        </PropertyPanelGroup>
        <PropertyPanelGroup>
          <PropertyPanelHeading>History</PropertyPanelHeading>
          <PropertyPanelList>
            <PropertyPanelRow>
              <PropertyPanelLabel>Created</PropertyPanelLabel>
              <PropertyPanelValue>
                <PropertyText dim>Hugo Bernard · 3 Nov</PropertyText>
              </PropertyPanelValue>
            </PropertyPanelRow>
          </PropertyPanelList>
        </PropertyPanelGroup>
      </PropertyPanel>
    </div>
  );
}
