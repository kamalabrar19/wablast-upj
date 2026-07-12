"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { importContactsCSV } from "@/lib/actions/contacts";

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportCSVDialog({ open, onOpenChange }: ImportCSVDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Pilih file CSV terlebih dahulu");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await importContactsCSV(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      setResult({
        imported: res.imported ?? 0,
        skipped: res.skipped ?? 0,
        errors: res.errors ?? [],
      });
      toast.success(`Berhasil mengimpor ${res.imported ?? 0} kontak`);
    } catch {
      toast.error("Gagal mengimpor");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setResult(null);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Kontak dari CSV</DialogTitle>
          <DialogDescription>
            Upload file CSV dengan kolom: nama, nomor (format 62xxx)
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-800 p-4">
              <p className="text-sm text-slate-400">Hasil Import:</p>
              <p className="mt-2 text-lg font-bold text-emerald-400">
                {result.imported} berhasil
              </p>
              {result.skipped > 0 && (
                <p className="text-sm text-amber-400">
                  {result.skipped} dilewati
                </p>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-800 p-3">
                <p className="mb-2 text-xs font-medium text-red-400">Error:</p>
                {result.errors.slice(0, 10).map((err, i) => (
                  <p key={i} className="text-xs text-slate-400">
                    {err}
                  </p>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
          </div>
        ) : (
          <form onSubmit={handleImport} className="space-y-4">
            <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-slate-500" />
              <p className="mt-2 text-sm text-slate-400">
                Pilih file CSV atau drag & drop
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="mt-4 block w-full text-sm text-slate-400 file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:text-slate-300"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
