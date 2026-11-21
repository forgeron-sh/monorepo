import { Badge, Board, BoardCard, BoardCards, BoardColumn, BoardColumnHeader } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: "100%" }}>
      <Board>
        <BoardColumn>
          <BoardColumnHeader count={2}>To do</BoardColumnHeader>
          <BoardCards>
            <BoardCard>Write the brief</BoardCard>
            <BoardCard>
              Book the venue <Badge tone="warning">Late</Badge>
            </BoardCard>
          </BoardCards>
        </BoardColumn>
        <BoardColumn>
          <BoardColumnHeader count={1}>Doing</BoardColumnHeader>
          <BoardCards>
            <BoardCard>Draft the invoice</BoardCard>
          </BoardCards>
        </BoardColumn>
      </Board>
    </div>
  );
}
