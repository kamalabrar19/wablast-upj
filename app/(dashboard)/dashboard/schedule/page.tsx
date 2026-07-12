import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ScheduleClient } from "./ScheduleClient";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Jadwal Pengiriman</h1>
        <p className="mt-1 text-sm text-slate-400">
          Lihat semua blast terjadwal
        </p>
      </div>

      <ScheduleClient />
    </div>
  );
}
