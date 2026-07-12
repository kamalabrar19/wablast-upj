import { z } from "zod";

const phoneRegex = /^62\d{8,13}$/;

export const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter"),
  phoneNumber: z
    .string()
    .min(1, "Nomor WhatsApp wajib diisi")
    .regex(phoneRegex, "Format nomor harus 62xxx (contoh: 628123456789)"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const contactGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Nama grup wajib diisi")
    .max(50, "Nama grup maksimal 50 karakter"),
  description: z.string().max(200).optional(),
});

export type ContactGroupInput = z.infer<typeof contactGroupSchema>;
