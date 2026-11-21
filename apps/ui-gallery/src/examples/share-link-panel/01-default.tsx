import {
  ShareLinkPanel,
  ShareLinkPanelClosed,
  ShareLinkPanelLink,
  ShareLinkPanelSwitch,
} from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 520, maxWidth: "100%" }}>
      <ShareLinkPanel url="https://forms.example.com/f/k3p9x2">
        <ShareLinkPanelLink label="Public link" />
        <ShareLinkPanelSwitch />
        <ShareLinkPanelClosed />
      </ShareLinkPanel>
    </div>
  );
}
