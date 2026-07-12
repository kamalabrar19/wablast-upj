import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { BlastListClient } from "./BlastListClient";

export default async function BlastPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blast</h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola pengiriman pesan WhatsApp
          </p>
        </div>
      </div>

      <BlastListClient />
    </div>
  );
}
