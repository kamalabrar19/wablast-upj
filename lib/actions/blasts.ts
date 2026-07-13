"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { blastSchema } from "@/lib/validations/blast";
import { startBlastWorker, processBlasts } from "@/lib/worker/runner";

export async function createBlast(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = blastSchema.safeParse({
    title: formData.get("title"),
    messageTemplate: formData.get("messageTemplate"),
    footer: formData.get("footer") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    delaySec: formData.get("delaySec") || 3,
    targetType: formData.get("targetType"),
    targetIds: JSON.parse(formData.get("targetIds") as string),
    scheduleType: formData.get("scheduleType"),
    scheduledAt: formData.get("scheduledAt") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { title, messageTemplate, footer, imageUrl, delaySec, targetType, targetIds, scheduleType, scheduledAt } =
    parsed.data;
  const delayMs = delaySec * 1000;

  // Get contact IDs from targets
  let contactIds: string[] = [];

  if (targetType === "contacts") {
    contactIds = targetIds;
  } else {
    // Get all contacts in selected groups
    const groupMembers = await prisma.contactGroupMember.findMany({
      where: { groupId: { in: targetIds } },
      select: { contactId: true },
    });
    contactIds = Array.from(new Set(groupMembers.map((m) => m.contactId)));
  }

  if (contactIds.length === 0) {
    return { error: "Tidak ada kontak yang dipilih" };
  }

  const blast = await prisma.blast.create({
    data: {
      title,
      messageTemplate,
      footer: footer || null,
      imageUrl: imageUrl || null,
      delayMs,
      status: scheduleType === "now" ? "sending" : "draft",
      scheduledAt: scheduleType === "scheduled" && scheduledAt ? new Date(scheduledAt) : null,
      createdById: session.user.id,
      targets: {
        create: contactIds.map((contactId) => ({
          contactId,
        })),
      },
      ...(targetType === "groups"
        ? {
            groups: {
              create: targetIds.map((groupId) => ({
                groupId,
              })),
            },
          }
        : {}),
    },
  });

  startBlastWorker();

  revalidatePath("/dashboard/blast");
  revalidatePath("/dashboard/schedule");
  return { success: true, blastId: blast.id };
}

export async function getBlasts(
  page = 1,
  limit = 10,
  search = "",
  startDate?: string,
  endDate?: string
) {
  startBlastWorker();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { data: [], total: 0, totalPages: 0 };

  const where: Record<string, unknown> = { createdById: session.user.id };

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  if (startDate || endDate) {
    const createdAt: Record<string, Date> = {};
    if (startDate) createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }

  const [data, total] = await Promise.all([
    prisma.blast.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { targets: true } },
        targets: {
          select: {
            status: true,
          },
        },
      },
    }),
    prisma.blast.count({ where: where as any }),
  ]);

  const dataWithStats = data.map((blast) => {
    const total = blast.targets.length;
    const sent = blast.targets.filter((t) =>
      ["sent", "read"].includes(t.status)
    ).length;
    const failed = blast.targets.filter((t) => t.status === "failed").length;
    return { ...blast, stats: { total, sent, failed } };
  });

  return {
    data: dataWithStats,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getBlastById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const blast = await prisma.blast.findFirst({
    where: { id, createdById: session.user.id },
    include: {
      targets: {
        include: {
          contact: true,
        },
        orderBy: { status: "asc" },
      },
      groups: {
        include: { group: true },
      },
    },
  });

  return blast;
}

export async function processBlastNow(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const blast = await prisma.blast.findFirst({
    where: { id, createdById: session.user.id },
  });
  if (!blast) return { error: "Blast tidak ditemukan" };

  await prisma.blast.update({
    where: { id },
    data: { status: "sending" },
  });

  startBlastWorker();
  processBlasts().catch(console.error);

  revalidatePath("/dashboard/blast");
  revalidatePath(`/dashboard/blast/${id}`);
  return { success: true };
}

export async function deleteBlast(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.blast.delete({ where: { id } });

  revalidatePath("/dashboard/blast");
  return { success: true };
}

export async function getScheduledBlasts(start: Date, end: Date) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const blasts = await prisma.blast.findMany({
    where: {
      createdById: session.user.id,
      status: { in: ["draft", "scheduled"] },
      scheduledAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      _count: { select: { targets: true } },
    },
  });

  return blasts;
}
