import {
  RankingField,
  RankingFieldItem,
  RankingFieldKeep,
  RankingFieldList,
  RankingFieldMain,
  RankingFieldStatus,
  RankingFieldUp,
  RankingFieldDown,
} from "@forgeron/ui";
import { useState } from "react";

const items = [
  { id: "api", label: "A public API" },
  { id: "mobile", label: "A mobile app" },
  { id: "sso", label: "Single sign-on" },
];

export default function Default() {
  const [order, setOrder] = useState<string[] | null>(null);
  return (
    <div style={{ width: 420, maxWidth: "100%" }}>
      <RankingField
        label="Rank these by how much you want them"
        items={items}
        value={order}
        onChange={setOrder}
      >
        <RankingFieldList>
          {(order ?? items.map((i) => i.id)).map((id) => (
            <RankingFieldItem key={id} id={id}>
              <RankingFieldMain />
              <RankingFieldUp />
              <RankingFieldDown />
            </RankingFieldItem>
          ))}
        </RankingFieldList>
        <RankingFieldKeep>Keep my order</RankingFieldKeep>
        <RankingFieldStatus />
      </RankingField>
    </div>
  );
}
