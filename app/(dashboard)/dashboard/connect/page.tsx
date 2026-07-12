import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isWAConnected } from "@/lib/whatsapp/connection";
import { QRConnectClient } from "./QRConnectClient";

export default async function ConnectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "staff") {
    redirect("/dashboard");
  }

  const connected = await isWAConnected(session.user.id);

  // If already connected, go to dashboard
  if (connected) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <QRConnectClient userId={session.user.id} userName={session.user.name ?? null} />
    </div>
  );
}
