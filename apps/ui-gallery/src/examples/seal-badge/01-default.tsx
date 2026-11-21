import {
  SealBadge,
  SealBadgeBody,
  SealBadgeFacts,
  SealBadgeMark,
  SealBadgeTop,
  SealBadgeWho,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <SealBadge
      action="Signed"
      who="Léa Martin"
      detail="Client"
      at="2026-11-19T14:32:10Z"
      method="Drawn signature, email code"
      hash="a3f91c07d5b2e8a4"
    >
      <SealBadgeMark />
      <SealBadgeBody>
        <SealBadgeTop />
        <SealBadgeWho />
        <SealBadgeFacts />
        <a href="#proof">Open the full proof</a>
      </SealBadgeBody>
    </SealBadge>
  );
}
