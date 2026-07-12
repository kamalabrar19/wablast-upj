"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, Eye, Variable, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTemplates, deleteTemplate } from "@/lib/actions/templates";

interface Template {
  id: string;
  name: string;
  body: string;
  footer: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

function extractVarNames(body: string): string[] {
  const matches = body.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.replace(/\{|\}/g, ""))));
}

export function TemplatesClient() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data as unknown as Template[]);
    } catch {
      toast.error("Gagal memuat template");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus template "${name}"?`)) return;
    const result = await deleteTemplate(id);
    if (result.success) {
      toast.success("Template dihapus");
      load();
    } else {
      toast.error(result.error || "Gagal menghapus");
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-4 w-3/4 rounded bg-slate-800" />
              <div className="mt-3 h-12 rounded bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16">
          <FileText className="h-12 w-12 text-slate-600" />
          <h3 className="mt-4 text-lg font-medium text-white">Belum ada template</h3>
          <p className="mt-1 text-sm text-slate-400">
            Buat template pesan pertama Anda untuk memudahkan pembuatan blast
          </p>
          <Link href="/dashboard/templates/new">
            <Button variant="whatsapp" className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Buat Template
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{templates.length} template</p>
        <Link href="/dashboard/templates/new">
          <Button variant="whatsapp" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Template Baru
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => {
          const vars = extractVarNames(t.body);
          return (
            <Card key={t.id} className="group relative">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link href={`/dashboard/templates/${t.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(t.id, t.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="mt-2 line-clamp-3 text-sm text-slate-400">
                  {t.body}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {vars.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Variable className="h-3 w-3" />
                      {vars.length} variable
                    </Badge>
                  )}
                  {t.footer && (
                    <Badge variant="outline" className="text-xs">
                      Footer
                    </Badge>
                  )}
                  {t.imageUrl && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <ImageIcon className="h-3 w-3" />
                      Gambar
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
