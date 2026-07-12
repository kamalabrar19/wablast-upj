import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blast = await prisma.blast.findFirst({
    where: { id: params.id, createdById: session.user.id },
    include: {
      targets: {
        include: { contact: true },
        orderBy: { status: "asc" },
      },
      groups: { include: { group: true } },
    },
  });

  if (!blast) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(blast);
}
