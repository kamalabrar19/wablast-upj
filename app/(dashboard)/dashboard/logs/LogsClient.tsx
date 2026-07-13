"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Send, Download, Eye, CheckCircle2, XCircle, MessageCircle, FileText, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getBlastLogs, getBlastDetail, exportBlastCSV } from "@/lib/actions/logs";

interface BlastLog {
  id: string;
  title: string;
  status: string;
  delayMs: number;
  createdAt: string;
  scheduledAt: string | null;
  stats: { total: number; sent: number; failed: number; read: number; replied: number };
}

interface BlastDetail {
  id: string;
  title: string;
  messageTemplate: string;
  footer: string | null;
  imageUrl: string | null;
  status: string;
  delayMs: number;
  createdAt: string;
  targets: {
    id: string;
    status: string;
    sentAt: string | null;
    readAt: string | null;
    errorMessage: string | null;
    contact: { name: string; phoneNumber: string };
  }[];
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-400",
  scheduled: "bg-amber-500/10 text-amber-400",
  sending: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  scheduled: "Terjadwal",
  sending: "Mengirim",
  completed: "Selesai",
  failed: "Gagal",
};

const targetStatusColors: Record<string, string> = {
  pending: "text-slate-500",
  sent: "text-emerald-400",
  failed: "text-red-400",
  read: "text-blue-400",
  replied: "text-purple-400",
};

const targetStatusIcons: Record<string, typeof Eye> = {
  pending: Loader2,
  sent: CheckCircle2,
  failed: XCircle,
  read: Eye,
  replied: MessageCircle,
};

export function LogsClient() {
  const [logs, setLogs] = useState<BlastLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlast, setSelectedBlast] = useState<BlastDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async (sd?: string, ed?: string) => {
    setIsLoading(true);
    try {
      const data = await getBlastLogs(sd || undefined, ed || undefined);
      setLogs(data as unknown as BlastLog[]);
    } catch {
      toast.error("Gagal memuat logs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(startDate, endDate);
  }, []); // initial load, no deps so it doesn't refilter on every keystroke

  useEffect(() => {
    load();
  }, [load]);

  async function viewDetail(blastId: string) {
    setDetailLoading(true);
    try {
      const data = await getBlastDetail(blastId);
      setSelectedBlast(data as unknown as BlastDetail);
    } catch {
      toast.error("Gagal memuat detail");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleExport(blastId: string, title: string) {
    setExportingId(blastId);
    try {
      const csv = await exportBlastCSV(blastId);
      if (!csv) {
        toast.error("Gagal export");
        return;
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blast-${title.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV berhasil didownload");
    } catch {
      toast.error("Gagal export CSV");
    } finally {
      setExportingId(null);
    }
  }

  function handleFilter() {
    load(startDate, endDate);
  }

  function clearFilter() {
    setStartDate("");
    setEndDate("");
    load("", "");
  }

  if (selectedBlast) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedBlast(null)}>
            &larr; Kembali
          </Button>
          <h2 className="text-lg font-semibold text-white">{selectedBlast.title}</h2>
          <Badge className={statusColors[selectedBlast.status]}>
            {statusLabels[selectedBlast.status] || selectedBlast.status}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
              <div>
                <p className="text-slate-500">Delay</p>
                <p className="font-medium text-white">{selectedBlast.delayMs / 1000} detik</p>
              </div>
              <div>
                <p className="text-slate-500">Target</p>
                <p className="font-medium text-white">{selectedBlast.targets.length} kontak</p>
              </div>
              <div>
                <p className="text-slate-500">Dibuat</p>
                <p className="font-medium text-white">
                  {format(new Date(selectedBlast.createdAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">{selectedBlast.targets.length} kontak</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport(selectedBlast.id, selectedBlast.title)}
            disabled={exportingId === selectedBlast.id}
          >
            {exportingId === selectedBlast.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nama</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nomor</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Waktu Kirim</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {selectedBlast.targets.map((t) => {
                const TIcon = targetStatusIcons[t.status] || Eye;
                return (
                  <tr key={t.id} className="hover:bg-slate-900">
                    <td className="px-4 py-3 text-white">{t.contact.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-400">{t.contact.phoneNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-sm ${targetStatusColors[t.status] || "text-slate-500"}`}>
                        <TIcon className={`h-4 w-4 ${t.status === "pending" ? "animate-spin" : ""}`} />
                        {t.status === "pending" && "Menunggu"}
                        {t.status === "sent" && "Terkirim"}
                        {t.status === "failed" && "Gagal"}
                        {t.status === "read" && "Terbaca"}
                        {t.status === "replied" && "Dibalas"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {t.sentAt ? format(new Date(t.sentAt), "dd MMM HH:mm") : "-"}
                    </td>
                    <td className="px-4 py-3 text-red-400">{t.errorMessage || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[140px]">
              <p className="mb-1 text-xs text-slate-500">Dari Tanggal</p>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="mb-1 text-xs text-slate-500">Sampai Tanggal</p>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <Button variant="whatsapp" size="sm" onClick={handleFilter} className="h-9">
              <Search className="mr-1.5 h-4 w-4" />
              Filter
            </Button>
            {(startDate || endDate) && (
              <Button variant="outline" size="sm" onClick={clearFilter} className="h-9">
                <X className="mr-1.5 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <FileText className="h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-white">Belum ada blast</h3>
            <p className="mt-1 text-sm text-slate-400">
              {startDate || endDate ? "Tidak ada blast di rentang tanggal tersebut" : "Buat blast terlebih dahulu untuk melihat logs"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Judul</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-center font-medium text-slate-400">Total</th>
                <th className="px-4 py-3 text-center font-medium text-slate-400">Terkirim</th>
                <th className="px-4 py-3 text-center font-medium text-slate-400">Gagal</th>
                <th className="px-4 py-3 text-center font-medium text-slate-400">Terbaca</th>
                <th className="px-4 py-3 text-center font-medium text-slate-400">Dibalas</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Dibuat</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900">
                  <td className="px-4 py-3 font-medium text-white">{b.title}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[b.status]}>
                      {statusLabels[b.status] || b.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400">{b.stats.total}</td>
                  <td className="px-4 py-3 text-center text-emerald-400">{b.stats.sent}</td>
                  <td className="px-4 py-3 text-center text-red-400">{b.stats.failed}</td>
                  <td className="px-4 py-3 text-center text-blue-400">{b.stats.read}</td>
                  <td className="px-4 py-3 text-center text-purple-400">{b.stats.replied}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {format(new Date(b.createdAt), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => viewDetail(b.id)}
                        title="Lihat detail"
                      >
                        {detailLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleExport(b.id, b.title)}
                        disabled={exportingId === b.id}
                        title="Export CSV"
                      >
                        {exportingId === b.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
