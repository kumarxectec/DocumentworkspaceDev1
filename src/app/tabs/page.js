
import TabsContainer from "@/components/tabs/tabs-container";

export default function TabsPage() {
  return (
    <div
      className="w-full pb-2"
      style={{ height: 'calc(100vh - 64px)' }} // adjust 64px as per Header height
    >
      <TabsContainer />
    </div>
  );
}
