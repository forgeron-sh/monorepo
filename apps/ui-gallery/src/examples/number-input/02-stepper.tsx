import { NumberInput } from "@forgeron/ui";
import { useState } from "react";

export default function Stepper() {
  const [seats, setSeats] = useState<number | null>(5);
  return <NumberInput label="Seats" value={seats} onChange={setSeats} min={1} max={500} />;
}
