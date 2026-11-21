import { Button, Notice, NoticeAction, NoticeDescription, NoticeTitle } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <Notice tone="warning">
        <NoticeTitle>The Odoo token expires in 3 days.</NoticeTitle>
        <NoticeDescription>Renew it before the sync stops.</NoticeDescription>
        <NoticeAction>
          <Button size="sm">Renew</Button>
        </NoticeAction>
      </Notice>
    </div>
  );
}
