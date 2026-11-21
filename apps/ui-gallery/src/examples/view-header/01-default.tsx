import { PlusSignIcon } from "@forgeron/icons";
import {
  IconButton,
  ViewHeader,
  ViewHeaderActions,
  ViewHeaderBar,
  ViewHeaderCount,
  ViewHeaderName,
  ViewHeaderTab,
  ViewHeaderTabs,
  ViewHeaderTitle,
} from "@forgeron/ui";
import { useState } from "react";

const tabs = [
  { value: "all", label: "All issues" },
  { value: "active", label: "Active", count: 12 },
  { value: "backlog", label: "Backlog" },
];

export default function Composed() {
  const [tab, setTab] = useState("active");
  return (
    <div style={{ width: 320, border: "1px solid var(--line)" }}>
      <ViewHeader>
        <ViewHeaderBar>
          <ViewHeaderTitle>
            <ViewHeaderName>Issues</ViewHeaderName>
          </ViewHeaderTitle>
          <ViewHeaderTabs>
            {tabs.map((t) => (
              <ViewHeaderTab
                key={t.value}
                current={t.value === tab}
                onClick={() => setTab(t.value)}
              >
                {t.label}
                {t.value === tab && t.count !== undefined ? (
                  <ViewHeaderCount>{t.count}</ViewHeaderCount>
                ) : null}
              </ViewHeaderTab>
            ))}
          </ViewHeaderTabs>
          <ViewHeaderActions>
            <IconButton icon={PlusSignIcon} label="New issue" variant="boxed" size="sm" />
          </ViewHeaderActions>
        </ViewHeaderBar>
      </ViewHeader>
    </div>
  );
}
