import { CommentPin } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", padding: "8px 0 14px" }}>
      <div style={{ position: "relative", width: 28, height: 28 }}>
        <CommentPin number={1} />
      </div>
      <div style={{ position: "relative", width: 28, height: 28 }}>
        <CommentPin number={12} unread />
      </div>
      <div style={{ position: "relative", width: 28, height: 28 }}>
        <CommentPin number={3} state="resolved" />
      </div>
      <div style={{ position: "relative", width: 28, height: 28 }}>
        <CommentPin number={4} active />
      </div>
    </div>
  );
}
