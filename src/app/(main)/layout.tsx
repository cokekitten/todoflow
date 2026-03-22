import { LeftSidebar } from "@/components/sidebar/left-sidebar";
import { RightSidebar } from "@/components/sidebar/right-sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <LeftSidebar />
      <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      <RightSidebar />
    </div>
  );
}
