import { z } from "zod";

export const blastSchema = z.object({
  title: z
    .string()
    .min(1, "Judul blast wajib diisi")
    .max(100, "Judul maksimal 100 karakter"),
  messageTemplate: z
    .string()
    .min(1, "Pesan wajib diisi")
    .max(5000, "Pesan maksimal 5000 karakter"),
  footer: z.string().optional(),
  imageUrl: z.string().optional(),
  delaySec: z.coerce.number().min(1, "Minimal delay 1 detik").max(15, "Maksimal delay 15 detik").default(3),
  targetType: z.enum(["contacts", "groups"]),
  targetIds: z.array(z.string()).min(1, "Pilih minimal 1 target"),
  scheduleType: z.enum(["now", "scheduled"]),
  scheduledAt: z.string().optional(),
}).refine(
  (data) => data.scheduleType !== "scheduled" || (data.scheduledAt && data.scheduledAt.length > 0),
  {
    message: "Pilih tanggal & jam pengiriman",
    path: ["scheduledAt"],
  }
);

export type BlastInput = z.infer<typeof blastSchema>;
