import { BarChart } from "@forgeron/ui";
import {
  WidgetFrame,
  WidgetFrameBody,
  WidgetFrameContent,
  WidgetFrameExpand,
  WidgetFrameFooter,
  WidgetFrameHeader,
  WidgetFrameMenu,
  WidgetFrameTitles,
  WidgetFrameTools,
} from "@forgeron/ui";

// The title and the state stay on the root (the dialog of "open full size" needs them); the layout
// is yours.
export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 440, height: 280 }}>
      <WidgetFrame
        title="Revenue by region"
        subtitle="Last 30 days"
        expandable
        menu={[
          { id: "refresh", label: "Refresh" },
          { id: "export", label: "Export CSV" },
        ]}
      >
        <WidgetFrameHeader>
          <WidgetFrameTitles />
          <WidgetFrameTools>
            <WidgetFrameExpand />
            <WidgetFrameMenu />
          </WidgetFrameTools>
        </WidgetFrameHeader>
        <WidgetFrameContent>
          <WidgetFrameBody>
            <BarChart
              title="By region"
              format={(n) => `€${n}k`}
              data={[
                { label: "EMEA", value: 84 },
                { label: "Americas", value: 61 },
                { label: "APAC", value: 33 },
              ]}
            />
          </WidgetFrameBody>
          <WidgetFrameFooter>Updated 2 minutes ago</WidgetFrameFooter>
        </WidgetFrameContent>
      </WidgetFrame>
    </div>
  );
}
