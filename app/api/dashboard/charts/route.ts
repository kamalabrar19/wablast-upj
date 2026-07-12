import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, format } from "date-fns";

async function getTargetFilter(userId: string, role: string) {
  if (role === "admin") return {};
  return { blast: { createdById: userId } };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = await getTargetFilter(session.user.id, session.user.role);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, "yyyy-MM-dd");
  });

  const blastsByDay = await Promise.all(
    last7Days.map(async (date) => {
      const start = new Date(date);
      const end = new Date(date + "T23:59:59.999Z");

      const [sent, failed] = await Promise.all([
        prisma.blastTarget.count({
          where: {
            ...filter,
            status: { in: ["sent", "read"] },
            sentAt: { gte: start, lte: end },
          },
        }),
        prisma.blastTarget.count({
          where: {
            ...filter,
            status: "failed",
            sentAt: { gte: start, lte: end },
          },
        }),
      ]);

      return { date, sent, failed };
    })
  );

  const [sent, failed, pending] = await Promise.all([
    prisma.blastTarget.count({
      where: { ...filter, status: { in: ["sent", "read"] } },
    }),
    prisma.blastTarget.count({
      where: { ...filter, status: "failed" },
    }),
    prisma.blastTarget.count({
      where: { ...filter, status: "pending" },
    }),
  ]);

  const statusDistribution = [
    { name: "Terkirim", value: sent, color: "#25D366" },
    { name: "Gagal", value: failed, color: "#ef4444" },
    { name: "Pending", value: pending, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return NextResponse.json({ blastsByDay, statusDistribution });
}
