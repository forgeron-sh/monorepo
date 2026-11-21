import { Badge } from "@forgeron/ui";

export default function Tones() {
  return (
    <>
      <Badge>Draft</Badge>
      <Badge tone="strong">Owner</Badge>
      <Badge tone="success" dot>
        Live
      </Badge>
      <Badge tone="warning" dot>
        Pending
      </Badge>
      <Badge tone="danger" dot>
        Failed
      </Badge>
    </>
  );
}
