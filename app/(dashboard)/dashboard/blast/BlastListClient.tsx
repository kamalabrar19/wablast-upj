"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Send, Loader2, Trash2, Calendar, Clock, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBlasts, deleteBlast } from "@/lib/actions/blasts";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "info" | "destructive" | "secondary" }> = {
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Terjadwal", variant: "warning" },
  sending: { label: "Mengirim", variant: "info" },
  completed: { label: "Selesai", variant: "success" },
  failed: { label: "Gagal", variant: "destructive" },
};

interface Blast {
  id: string;
  title: string;
  status: string;
  scheduledAt: Date | null;
  createdAt: Date;
  _count: { targets: number };
  stats: { total: number; sent: number; failed: number };
}

export function BlastListClient() {
  const [blasts, setBlasts] = useState<Blast[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBlasts = useCallback(async () => {
    setIsLoading(true);
    try {
      const s = search || undefined;
      const sd = startDate || undefined;
      const ed = endDate || undefined;
      const result = await getBlasts(page, 10, s, sd, ed);
      setBlasts(result.data as unknown as Blast[]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, startDate, endDate]);

  useEffect(() => {
    fetchBlasts();
  }, [fetchBlasts]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const clearDate = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = search || startDate || endDate;

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteBlast(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Blast berhasil dihapus");
      fetchBlasts();
    }
    setDeletingId(null);
  }

  return (
    <div>
      {/* Toolbar: Filters + Buat Blast */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Cari judul blast..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 pr-8"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Date range */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="w-40"
            title="Dari tanggal"
          />
          <span className="text-sm text-slate-500">s.d</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="w-40"
            title="Sampai tanggal"
          />

          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Search className="mr-1.5 h-4 w-4" />
            Cari
          </Button>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { clearSearch(); clearDate(); }}>
              <X className="mr-1.5 h-4 w-4" />
              Reset
            </Button>
          )}

          <div className="ml-auto">
            <Link href="/dashboard/blast/new">
              <Button variant="whatsapp">
                <Plus className="mr-2 h-4 w-4" />
                Buat Blast Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Results summary */}
      {!isLoading && !hasFilters && blasts.length > 0 && (
        <p className="mb-3 text-xs text-slate-500">
          Menampilkan {blasts.length} dari {total} blast
        </p>
      )}
      {!isLoading && hasFilters && (
        <p className="mb-3 text-xs text-slate-500">
          {total === 0
            ? "Tidak ditemukan"
            : `Menampilkan ${blasts.length} dari ${total} hasil`}
          {search && ` untuk "${search}"`}
          {(startDate || endDate) && ` (filter tanggal)`}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : blasts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 p-12 text-center">
          <Send className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-lg font-medium text-slate-400">
            {hasFilters ? "Tidak ada blast yang cocok" : "Belum ada blast"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {hasFilters
              ? "Coba ubah pencarian atau filter tanggal"
              : "Buat pengiriman pesan WhatsApp pertama Anda"}
          </p>
          {!hasFilters && (
            <Link href="/dashboard/blast/new">
              <Button variant="whatsapp" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Buat Blast Baru
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Terkirim</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blasts.map((blast) => {
                const config = statusConfig[blast.status] || statusConfig.draft;
                return (
                  <TableRow key={blast.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/blast/${blast.id}`}
                        className="font-medium text-white hover:text-whatsapp transition-colors"
                      >
                        {blast.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {blast._count.targets} kontak
                    </TableCell>
                    <TableCell>
                      <span className="text-emerald-400">
                        {blast.stats.sent}
                      </span>
                      {blast.stats.failed > 0 && (
                        <span className="ml-2 text-red-400">
                          {blast.stats.failed} gagal
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {blast.scheduledAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(blast.scheduledAt), "d MMM yyyy, HH:mm", { locale: id })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(blast.createdAt), "d MMM yyyy, HH:mm", { locale: id })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(blast.id)}
                        disabled={deletingId === blast.id}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        {deletingId === blast.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Sebelumnya
          </Button>
          <span className="px-3 text-sm text-slate-400">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}
