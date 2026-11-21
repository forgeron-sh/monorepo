import { Badge, DetailList, DetailListItem, DetailListTerm, DetailListValue } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: 320 }}>
      <DetailList>
        <DetailListItem>
          <DetailListTerm>Owner</DetailListTerm>
          <DetailListValue>Hugo Bernard</DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListTerm>Status</DetailListTerm>
          <DetailListValue>
            <Badge tone="success" dot>
              Live
            </Badge>
          </DetailListValue>
        </DetailListItem>
      </DetailList>
    </div>
  );
}
