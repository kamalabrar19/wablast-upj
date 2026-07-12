"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getBlastLogs(startDate?: string, endDate?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const where: any = { createdById: session.user.id };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
  }

  const blasts = await prisma.blast.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { targets: true } },
      targets: {
        select: { status: true },
      },
    },
  });

  return blasts.map((b) => {
    const total = b.targets.length;
    const sent = b.targets.filter((t) => t.status === "sent" || t.status === "read" || t.status === "replied").length;
    const failed = b.targets.filter((t) => t.status === "failed").length;
    const read = b.targets.filter((t) => t.status === "read" || t.status === "replied").length;
    const replied = b.targets.filter((t) => t.status === "replied").length;
    return { ...b, stats: { total, sent, failed, read, replied } };
  });
}

export async function getBlastDetail(blastId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return prisma.blast.findFirst({
    where: { id: blastId, createdById: session.user.id },
    include: {
      targets: {
        include: { contact: true },
        orderBy: { status: "asc" },
      },
      groups: { include: { group: true } },
    },
  });
}

export async function exportBlastCSV(blastId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const blast = await prisma.blast.findFirst({
    where: { id: blastId, createdById: session.user.id },
    include: {
      targets: {
        include: { contact: true },
        orderBy: { status: "asc" },
      },
    },
  });

  if (!blast) return null;

  const statusLabel: Record<string, string> = {
    pending: "Menunggu",
    sent: "Terkirim",
    failed: "Gagal",
    read: "Terbaca",
    replied: "Dibalas",
  };

  const header = "Nama,Nomor HP,Status,Waktu Kirim,Error\n";
  const rows = blast.targets
    .map((t) => {
      const name = `"${(t.contact.name || "").replace(/"/g, '""')}"`;
      const phone = t.contact.phoneNumber;
      const status = statusLabel[t.status] || t.status;
      const sentAt = t.sentAt ? new Date(t.sentAt).toISOString() : "";
      const error = t.errorMessage ? `"${t.errorMessage.replace(/"/g, '""')}"` : "";
      return `${name},${phone},${status},${sentAt},${error}`;
    })
    .join("\n");

  const title = `"${blast.title.replace(/"/g, '""')}"`;
  return `\uFEFF${header}${rows}`;
}
