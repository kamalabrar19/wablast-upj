import { z } from "zod";

export const templateSchema = z.object({
  name: z.string().min(1, "Nama template harus diisi"),
  body: z.string().min(1, "Body pesan harus diisi"),
  footer: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type TemplateInput = z.infer<typeof templateSchema>;
