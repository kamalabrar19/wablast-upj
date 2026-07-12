import { SessionProvider } from "@/components/shared/SessionProvider";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 pt-16 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
