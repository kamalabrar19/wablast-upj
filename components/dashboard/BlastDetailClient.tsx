"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, RefreshCw, WifiOff } from "lucide-react";
import { processBlastNow } from "@/lib/actions/blasts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Contact {
  name: string;
  phoneNumber: string;
}

interface BlastTarget {
  id: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  contact: Contact;
}

interface BlastGroup {
  groupId: string;
  group: { name: string };
}

interface BlastData {
  id: string;
  title: string;
  status: string;
  messageTemplate: string;
  createdAt: string;
  scheduledAt: string | null;
  targets: BlastTarget[];
  groups: BlastGroup[];
}

interface Props {
  initialBlast: BlastData;
  sessionUserId: string;
}

const blastStatusLabels: Record<string, string> = {
  draft: "Draft",
  scheduled: "Terjadwal",
  sending: "Mengirim...",
  completed: "Selesai",
  failed: "Gagal",
};

const targetStatusLabels: Record<string, { label: string; variant: "success" | "warning" | "info" | "destructive" | "secondary" }> = {
  pending: { label: "Menunggu", variant: "secondary" },
  sent: { label: "Terkirim", variant: "success" },
  failed: { label: "Gagal", variant: "destructive" },
  read: { label: "Dibaca", variant: "info" },
};

export default function BlastDetailClient({ initialBlast, sessionUserId }: Props) {
  const router = useRouter();
  const [blast, setBlast] = useState<BlastData>(initialBlast);
  const [loading, setLoading] = useState(false);
  const [waConnected, setWaConnected] = useState<boolean | null>(null);

  const isActive = blast.status === "sending" || blast.status === "draft" || blast.status === "scheduled";

  const checkWA = useCallback(async () => {
    try {
      const res = await fetch("/api/wa/status");
      const data = await res.json();
      setWaConnected(data.connected);
    } catch {
      setWaConnected(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/blast/${blast.id}`);
      if (res.ok) {
        const data = await res.json();
        setBlast(data);
        router.refresh();
      }
    } catch {
      // ignore
    }
  }, [blast.id, router]);

  // Auto-refresh while active
  useEffect(() => {
    if (!isActive) return;
    checkWA();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [isActive, refresh, checkWA]);

  // Check WA on mount
  useEffect(() => {
    checkWA();
  }, [checkWA]);

  const handleProcessNow = async () => {
    setLoading(true);
    try {
      const result = await processBlastNow(blast.id);
      if (result.success) {
        refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const total = blast.targets.length;
  const sent = blast.targets.filter((t) =>
    ["sent", "read"].includes(t.status)
  ).length;
  const failed = blast.targets.filter((t) => t.status === "failed").length;
  const pending = blast.targets.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-white">{blast.title}</h1>
          <Badge
            variant={
              blast.status === "completed"
                ? "success"
                : blast.status === "failed"
                  ? "destructive"
                  : blast.status === "sending"
                    ? "info"
                    : blast.status === "scheduled"
                      ? "warning"
                      : "secondary"
            }
          >
            {blastStatusLabels[blast.status] || blast.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Dibuat{" "}
          {format(new Date(blast.createdAt), "d MMMM yyyy, HH:mm", { locale: id })}
          {blast.scheduledAt &&
            ` • Terjadwal ${format(new Date(blast.scheduledAt), "d MMMM yyyy, HH:mm", { locale: id })}`}
        </p>
      </div>

      {/* Connection warning */}
      {isActive && waConnected === false && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-800 bg-amber-900/20 p-4 text-sm text-amber-400">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>
            WhatsApp belum terhubung. Buka menu <strong>Connect</strong> di sidebar untuk scan QR code.
          </span>
        </div>
      )}

      {/* Action buttons */}
      {isActive && (
        <div className="flex gap-3">
          {waConnected && (
            <Button
              variant="whatsapp"
              onClick={handleProcessNow}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {blast.status === "sending" ? "Proses Sekarang" : "Kirim Sekarang"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={refresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Terkirim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">{sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Gagal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">{failed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Menunggu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-400">{pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Message preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-400">
            Pesan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-white">
            {blast.messageTemplate}
          </p>
        </CardContent>
      </Card>

      {/* Target groups */}
      {blast.groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-400">Grup:</span>
          {blast.groups.map((bg) => (
            <Badge key={bg.groupId} variant="secondary">
              {bg.group.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Targets table */}
      <div className="rounded-xl border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Nomor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Waktu Kirim</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blast.targets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  Belum ada target
                </TableCell>
              </TableRow>
            ) : (
              blast.targets.map((target) => {
                const config = targetStatusLabels[target.status] || targetStatusLabels.pending;
                return (
                  <TableRow key={target.id}>
                    <TableCell className="font-medium text-white">
                      {target.contact.name}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {target.contact.phoneNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {target.sentAt
                        ? format(new Date(target.sentAt), "d MMM HH:mm", {
                            locale: id,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-red-400">
                      {target.errorMessage || "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
