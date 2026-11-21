import { Tabs, TabsContent, TabsList, TabsTrigger } from "@forgeron/ui";

// shadcn's composition: Tabs without tabs is the root; a value ties a trigger to its content.
export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview of the tool.</TabsContent>
        <TabsContent value="activity">Activity of the tool.</TabsContent>
      </Tabs>
    </div>
  );
}
