import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { BlastWizard } from "@/components/dashboard/BlastWizard";

export default async function NewBlastPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Buat Blast Baru</h1>
        <p className="mt-1 text-sm text-slate-400">
          Buat pengiriman pesan WhatsApp terjadwal
        </p>
      </div>

      <BlastWizard />
    </div>
  );
}
