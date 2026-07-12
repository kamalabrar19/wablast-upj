import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isWAConnected } from "@/lib/whatsapp/connection";
import { AdminDashboard } from "./AdminDashboard";
import { StaffDashboard } from "./StaffDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Staff must connect WhatsApp first
  if (session.user.role === "staff") {
    const connected = await isWAConnected(session.user.id);
    if (!connected) {
      redirect("/dashboard/connect");
    }
    return <StaffDashboard session={session} />;
  }

  return <AdminDashboard session={session} />;
}
