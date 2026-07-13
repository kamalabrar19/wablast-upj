import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TemplateForm } from "@/components/dashboard/TemplateForm";
import { getTemplate } from "@/lib/actions/templates";

interface Props {
  params: { id: string };
}

export default async function EditTemplatePage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const template = await getTemplate(params.id);
  if (!template) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Template</h1>
        <p className="mt-1 text-sm text-slate-400">
          Edit template pesan
        </p>
      </div>

      <TemplateForm
        templateId={params.id}
        defaultValues={{
          name: template.name,
          body: template.body,
          footer: template.footer || "",
          imageUrl: template.imageUrl || "",
        }}
      />
    </div>
  );
}
