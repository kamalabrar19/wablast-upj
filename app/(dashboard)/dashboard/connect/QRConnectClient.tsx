"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Smartphone, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface QRConnectClientProps {
  userId: string;
  userName: string | null;
}

export function QRConnectClient({ userId, userName }: QRConnectClientProps) {
  const router = useRouter();
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qrPollRef = useRef<ReturnType<typeof setInterval>>();
  const statusPollRef = useRef<ReturnType<typeof setInterval>>();
  const connectCalledRef = useRef(false);

  const startConnection = useCallback(async () => {
    if (connectCalledRef.current) return;
    connectCalledRef.current = true;

    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/wa/connect", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal memulai koneksi");
        setIsStarting(false);
      }
    } catch {
      setError("Gagal menghubungi server");
      setIsStarting(false);
    }
  }, []);

  // Trigger Baileys connection once on mount
  useEffect(() => {
    startConnection();
  }, [startConnection]);

  // Poll QR code
  useEffect(() => {
    qrPollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/wa/qr");
        const data = await res.json();

        if (data.connected) {
          setIsConnected(true);
          return;
        }

        if (data.qr) {
          setQrImage(data.qr);
          setIsStarting(false);
        } else if (data.starting !== undefined) {
          setIsStarting(data.starting);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, []);

  // Poll connection status (stops once connected)
  useEffect(() => {
    statusPollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/wa/status");
        const data = await res.json();
        if (data.connected) {
          setIsConnected(true);
          clearInterval(statusPollRef.current);
          setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
          }, 1500);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => {
      if (statusPollRef.current) clearInterval(statusPollRef.current);
    };
  }, [router]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setQrImage(null);
    setError(null);
    setIsStarting(true);
    connectCalledRef.current = false;
    await startConnection();
  }, [startConnection]);

  if (isConnected) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-6">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
          <h2 className="mt-4 text-xl font-bold text-white">WhatsApp Terhubung!</h2>
          <p className="mt-2 text-sm text-slate-400">Mengalihkan ke dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-whatsapp/10">
          <Smartphone className="h-7 w-7 text-whatsapp" />
        </div>
        <CardTitle>Hubungkan WhatsApp</CardTitle>
        <CardDescription>
          Scan QR code di bawah dengan WhatsApp Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {qrImage ? (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImage}
              alt="Scan QR Code dengan WhatsApp"
              className="h-64 w-64 rounded-xl bg-white p-2"
            />
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            <p className="mt-4 text-sm text-slate-500">
              {isStarting
                ? "Menghubungkan ke WhatsApp..."
                : "Menunggu QR code dari WhatsApp..."}
            </p>
          </div>
        )}

        <div className="rounded-lg bg-slate-800/50 p-4 text-center">
          <p className="text-sm text-slate-400">
            Halo, <span className="font-medium text-white">{userName || "User"}</span>
          </p>
          <ol className="mt-3 space-y-1 text-left text-xs text-slate-500">
            <li>1. Buka WhatsApp di ponsel</li>
            <li>2. Tap titik tiga &raquo; Perangkat Tertaut</li>
            <li>3. Tap &quot;Tautkan Perangkat&quot;</li>
            <li>4. Arahkan kamera ke QR code ini</li>
          </ol>
        </div>

        <Button variant="outline" className="w-full" onClick={handleRefresh} disabled={isStarting}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isStarting ? "animate-spin" : ""}`} />
          Refresh QR Code
        </Button>
      </CardContent>
    </Card>
  );
}
