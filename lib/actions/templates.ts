"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { templateSchema, type TemplateInput } from "@/lib/validations/template";
import { revalidatePath } from "next/cache";

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.replace(/\{|\}/g, ""))));
}

export async function getTemplates() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return prisma.messageTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTemplate(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return prisma.messageTemplate.findFirst({
    where: { id, userId: session.user.id },
  });
}

export async function createTemplate(data: TemplateInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = templateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message || "Invalid data" };

  await prisma.messageTemplate.create({
    data: {
      ...parsed.data,
      footer: parsed.data.footer || null,
      imageUrl: parsed.data.imageUrl || null,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/templates");
  return { success: true };
}

export async function updateTemplate(id: string, data: TemplateInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await prisma.messageTemplate.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { error: "Template tidak ditemukan" };

  const parsed = templateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message || "Invalid data" };

  await prisma.messageTemplate.update({
    where: { id },
    data: {
      ...parsed.data,
      footer: parsed.data.footer || null,
      imageUrl: parsed.data.imageUrl || null,
    },
  });

  revalidatePath("/dashboard/templates");
  return { success: true };
}

export async function deleteTemplate(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await prisma.messageTemplate.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { error: "Template tidak ditemukan" };

  await prisma.messageTemplate.delete({ where: { id } });

  revalidatePath("/dashboard/templates");
  return { success: true };
}
