"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ImagePlus, X, Variable, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { templateSchema, type TemplateInput } from "@/lib/validations/template";
import { createTemplate, updateTemplate } from "@/lib/actions/templates";

const PREDEFINED_VARS = [
  { label: "Nama", value: "nama" },
  { label: "Tanggal", value: "tanggal" },
];

interface TemplateFormProps {
  defaultValues?: TemplateInput;
  templateId?: string;
}

export function TemplateForm({ defaultValues, templateId }: TemplateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isEditing = !!templateId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TemplateInput>({
    resolver: zodResolver(templateSchema),
    defaultValues: defaultValues || { name: "", body: "", footer: "", imageUrl: "" },
  });

  const imageUrl = watch("imageUrl");

  function insertVariable(varName: string) {
    const current = getValues("body");
    setValue("body", current + `{{${varName}}}`, { shouldValidate: true });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setValue("imageUrl", data.url);
        toast.success("Gambar berhasil diupload");
      } else {
        toast.error(data.error || "Gagal upload");
      }
    } catch {
      toast.error("Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  }

  async function onFormSubmit(data: TemplateInput) {
    setIsLoading(true);
    try {
      const result = isEditing
        ? await updateTemplate(templateId!, data)
        : await createTemplate(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Template diupdate" : "Template dibuat");
        router.push("/dashboard/templates");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Template</Label>
        <Input
          id="name"
          placeholder="Contoh: Info Pendaftaran"
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Pesan</Label>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {PREDEFINED_VARS.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => insertVariable(v.value)}
              className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              <Variable className="h-3 w-3" />
              {`{{${v.value}}}`}
            </button>
          ))}
        </div>

        <Textarea
          id="body"
          rows={8}
          placeholder={`Halo {{nama}},\n\nKami dari UPJ ingin menginformasikan...`}
          {...register("body")}
          className={errors.body ? "border-red-500" : ""}
        />
        {errors.body && <p className="text-xs text-red-400">{errors.body.message}</p>}
        <p className="text-xs text-slate-500">
          Klik tombol variable di atas untuk menyisipkan {'{{nama}}'} atau {'{{tanggal}}'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="footer">Footer (opsional)</Label>
        <Input
          id="footer"
          placeholder="Contoh: Tim Marketing UPJ"
          {...register("footer")}
        />
        <p className="text-xs text-slate-500">Teks footer yang muncul di bagian bawah pesan</p>
      </div>

      <div className="space-y-2">
        <Label>Gambar (opsional)</Label>

        {imageUrl ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              className="h-32 w-32 rounded-lg border border-slate-800 object-cover"
            />
            <button
              type="button"
              onClick={() => setValue("imageUrl", "")}
              className="absolute -top-2 -right-2 rounded-full bg-red-500 p-0.5 text-white shadow"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400 hover:border-slate-600">
            <Upload className="h-5 w-5" />
            {uploading ? "Mengupload..." : "Klik untuk upload gambar (max 2MB, JPG/PNG/WebP/GIF)"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}

        <div className="space-y-1">
          <Label htmlFor="imageUrl">Atau masukkan URL gambar</Label>
          <Input
            id="imageUrl"
            placeholder="https://example.com/image.jpg"
            {...register("imageUrl")}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" variant="whatsapp" disabled={isLoading || uploading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Simpan Perubahan" : "Buat Template"}
        </Button>
      </div>
    </form>
  );
}
