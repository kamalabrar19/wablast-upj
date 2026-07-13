import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LogsClient } from "./LogsClient";

export default async function LogsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Logs Pengiriman</h1>
        <p className="mt-1 text-sm text-slate-400">
          Pantau status pengiriman blast per kontak
        </p>
      </div>

      <LogsClient />
    </div>
  );
}
