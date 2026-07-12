import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TemplatesClient } from "./TemplatesClient";

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Template Pesan</h1>
        <p className="mt-1 text-sm text-slate-400">
          Buat dan kelola template pesan WhatsApp dengan variable, footer, dan gambar
        </p>
      </div>

      <TemplatesClient />
    </div>
  );
}
