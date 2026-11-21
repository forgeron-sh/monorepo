import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: "min(100%, 480px)" }}>
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>Yes. It follows the WAI-ARIA accordion pattern.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>Yes: sharp corners, hairlines, one accent.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Can several be open?</AccordionTrigger>
          <AccordionContent>With type="multiple", yes.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
