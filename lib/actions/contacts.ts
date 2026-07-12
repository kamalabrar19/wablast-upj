"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { contactSchema, contactGroupSchema } from "@/lib/validations/contact";
import { parse } from "csv-parse/sync";

export async function getContacts(page = 1, search = "", limit = 10) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { data: [], total: 0, totalPages: 0 };

  const where = {
    createdById: session.user.id,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phoneNumber: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        groupMembers: {
          include: { group: true },
        },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createContact(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await prisma.contact.findUnique({
    where: {
      phoneNumber_createdById: {
        phoneNumber: parsed.data.phoneNumber,
        createdById: session.user.id,
      },
    },
  });

  if (existing) {
    return { error: "Nomor ini sudah terdaftar" };
  }

  await prisma.contact.create({
    data: {
      ...parsed.data,
      createdById: session.user.id,
    },
  });

  revalidatePath("/dashboard/contacts");
  return { success: true };
}

export async function updateContact(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await prisma.contact.findFirst({
    where: {
      phoneNumber: parsed.data.phoneNumber,
      createdById: session.user.id,
      id: { not: id },
    },
  });

  if (existing) {
    return { error: "Nomor ini sudah terdaftar" };
  }

  await prisma.contact.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/dashboard/contacts");
  return { success: true };
}

export async function deleteContact(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.contact.delete({ where: { id } });

  revalidatePath("/dashboard/contacts");
  return { success: true };
}

export async function importContactsCSV(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const file = formData.get("file") as File;
  if (!file) return { error: "File CSV wajib diupload" };

  const text = await file.text();

  let records: Record<string, string>[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { error: "Format CSV tidak valid" };
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const phoneRegex = /^62\d{8,13}$/;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const name = record.nama || record.name || record.Nama || "";
    const phone =
      record.nomor ||
      record.phone ||
      record.phoneNumber ||
      record.Phone ||
      record.NoHP ||
      "";

    if (!name || !phone) {
      skipped++;
      errors.push(`Baris ${i + 2}: Nama atau nomor tidak ditemukan`);
      continue;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0")
      ? "62" + cleanPhone.slice(1)
      : cleanPhone.startsWith("62")
        ? cleanPhone
        : "62" + cleanPhone;

    if (!phoneRegex.test(formattedPhone)) {
      skipped++;
      errors.push(`Baris ${i + 2}: Format nomor tidak valid (${phone})`);
      continue;
    }

    try {
      await prisma.contact.create({
        data: {
          name: name.trim(),
          phoneNumber: formattedPhone,
          createdById: session.user.id,
        },
      });
      imported++;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
        skipped++;
        errors.push(`Baris ${i + 2}: Nomor ${formattedPhone} sudah terdaftar`);
      } else {
        skipped++;
        errors.push(`Baris ${i + 2}: Gagal menyimpan`);
      }
    }
  }

  revalidatePath("/dashboard/contacts");
  return { success: true, imported, skipped, errors };
}

export async function getContactGroups() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return prisma.contactGroup.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true } },
    },
  });
}

export async function getGroupContacts(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const members = await prisma.contactGroupMember.findMany({
    where: { groupId },
    include: { contact: true },
  });
  return members.map((m) => m.contact);
}

export async function createContactGroup(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = contactGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.contactGroup.create({
    data: parsed.data,
  });

  revalidatePath("/dashboard/contacts");
  return { success: true };
}

export async function deleteContactGroup(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.contactGroup.delete({ where: { id } });

  revalidatePath("/dashboard/contacts");
  return { success: true };
}

export async function addContactsToGroup(contactIds: string[], groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.contactGroupMember.createMany({
    data: contactIds.map((contactId) => ({ contactId, groupId })),
    skipDuplicates: true,
  });

  revalidatePath("/dashboard/contacts");
  return { success: true };
}

export async function removeContactFromGroup(contactId: string, groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.contactGroupMember.delete({
    where: { contactId_groupId: { contactId, groupId } },
  });

  revalidatePath("/dashboard/contacts");
  return { success: true };
}
