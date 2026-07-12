"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  contactGroupSchema,
  type ContactGroupInput,
} from "@/lib/validations/contact";
import { createContactGroup } from "@/lib/actions/contacts";

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupDialog({ open, onOpenChange }: GroupDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactGroupInput>({
    resolver: zodResolver(contactGroupSchema),
  });

  async function onSubmit(data: ContactGroupInput) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");

      const result = await createContactGroup(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Grup berhasil dibuat");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Grup Baru</DialogTitle>
          <DialogDescription>
            Kelompokkan kontak berdasarkan kategori
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nama Grup</Label>
            <Input
              id="groupName"
              placeholder="Contoh: Mahasiswa Baru 2024"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Input
              id="description"
              placeholder="Deskripsi grup"
              {...register("description")}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Buat Grup"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
