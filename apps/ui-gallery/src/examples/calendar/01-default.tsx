import {
  Calendar,
  CalendarGrid,
  CalendarHeader,
  CalendarNext,
  CalendarPrevious,
  CalendarTitle,
} from "@forgeron/ui";
import { useState } from "react";

export default function Composed() {
  const [day, setDay] = useState("2026-11-18");
  return (
    <Calendar label="Due date" today="2026-11-17" value={day} onChange={setDay}>
      <CalendarHeader>
        <CalendarPrevious />
        <CalendarTitle />
        <CalendarNext />
      </CalendarHeader>
      <CalendarGrid />
    </Calendar>
  );
}
