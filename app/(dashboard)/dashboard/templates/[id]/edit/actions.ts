"use server";

import { updateTemplate } from "@/lib/actions/templates";
import type { TemplateInput } from "@/lib/validations/template";

export async function updateTemplateAction(id: string, data: TemplateInput) {
  return updateTemplate(id, data);
}
