import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TemplateForm } from "@/components/dashboard/TemplateForm";
import { createTemplate } from "@/lib/actions/templates";

export default async function NewTemplatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Template Baru</h1>
        <p className="mt-1 text-sm text-slate-400">
          Buat template pesan dengan variable, footer, dan gambar
        </p>
      </div>

      <TemplateForm onSubmit={createTemplate} />
    </div>
  );
}
