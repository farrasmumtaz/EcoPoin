import Sidebar from "../components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-hidden bg-neutral-50">
        {children}
      </main>
    </div>
  );
}