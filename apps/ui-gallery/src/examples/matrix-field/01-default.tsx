import {
  MatrixField,
  MatrixFieldCell,
  MatrixFieldColumns,
  MatrixFieldRow,
  type FormMatrixAnswer,
} from "@forgeron/ui";
import { useState } from "react";

const rows = [
  { id: "speed", label: "Speed" },
  { id: "docs", label: "Documentation" },
];
const columns = [
  { id: "1", label: "Poor" },
  { id: "2", label: "Fair" },
  { id: "3", label: "Good" },
];

export default function Default() {
  const [value, setValue] = useState<FormMatrixAnswer>({});
  return (
    <div style={{ width: 460, maxWidth: "100%" }}>
      <MatrixField
        label="How satisfied are you?"
        rows={rows}
        columns={columns}
        value={value}
        onChange={setValue}
      >
        <MatrixFieldColumns />
        <tbody>
          {rows.map((r) => (
            <MatrixFieldRow key={r.id} row={r.id}>
              {columns.map((c) => (
                <MatrixFieldCell key={c.id} row={r.id} column={c.id} />
              ))}
            </MatrixFieldRow>
          ))}
        </tbody>
      </MatrixField>
    </div>
  );
}
