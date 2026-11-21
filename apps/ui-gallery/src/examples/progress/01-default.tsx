import { Progress } from "@forgeron/ui";
import { useEffect, useState } from "react";

export default function Composed() {
  const [value, setValue] = useState(13);
  useEffect(() => {
    const timer = setTimeout(() => setValue(66), 500);
    return () => clearTimeout(timer);
  }, []);
  return <Progress value={value} style={{ width: "60%" }} />;
}
