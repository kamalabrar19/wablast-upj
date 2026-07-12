import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ContactsClient } from "./ContactsClient";

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kontak</h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola database kontak WhatsApp Anda
          </p>
        </div>
      </div>

      <ContactsClient />
    </div>
  );
}
