import Sidebar from "../components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex print:block">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-neutral-50 p-8 print:overflow-visible print:bg-white print:p-0">
        {children}
      </main>
    </div>
  );
}
