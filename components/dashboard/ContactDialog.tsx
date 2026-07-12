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
import { contactSchema, type ContactInput } from "@/lib/validations/contact";
import { createContact, updateContact } from "@/lib/actions/contacts";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: {
    id: string;
    name: string;
    phoneNumber: string;
  } | null;
}

export function ContactDialog({
  open,
  onOpenChange,
  contact,
}: ContactDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!contact;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact?.name || "",
      phoneNumber: contact?.phoneNumber || "",
    },
  });

  async function onSubmit(data: ContactInput) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("phoneNumber", data.phoneNumber);

      const result = isEditing
        ? await updateContact(contact!.id, formData)
        : await createContact(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Kontak berhasil diupdate" : "Kontak berhasil ditambahkan");
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
          <DialogTitle>
            {isEditing ? "Edit Kontak" : "Tambah Kontak"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah data kontak yang sudah ada"
              : "Tambahkan kontak baru ke database"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              placeholder="Nama kontak"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Nomor WhatsApp</Label>
            <Input
              id="phoneNumber"
              placeholder="628123456789"
              {...register("phoneNumber")}
              className={errors.phoneNumber ? "border-red-500" : ""}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-red-400">
                {errors.phoneNumber.message}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Format: 62xxx (contoh: 628123456789)
            </p>
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
              ) : isEditing ? (
                "Simpan"
              ) : (
                "Tambah"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
