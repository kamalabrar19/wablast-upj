import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getBlastById } from "@/lib/actions/blasts";
import BlastDetailClient from "@/components/dashboard/BlastDetailClient";

interface PageProps {
  params: { id: string };
}

export default async function BlastDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const blast = await getBlastById(params.id);

  if (!blast) {
    notFound();
  }

  return (
    <BlastDetailClient
      initialBlast={JSON.parse(JSON.stringify(blast))}
      sessionUserId={session.user.id}
    />
  );
}
