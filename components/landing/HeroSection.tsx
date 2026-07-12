import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-whatsapp/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-whatsapp/5 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-300">
              <MessageSquare className="h-4 w-4 text-whatsapp" />
              Solusi Marketing Digital UPJ
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Efisiensi Komunikasi Marketing{" "}
              <span className="text-whatsapp">via WhatsApp</span>{" "}
              Terjadwal
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-400 sm:text-lg">
              Kirim pesan WhatsApp ke ribuan kontak secara terjadwal, kelola
              database penerima, dan pantau statistik pengiriman real-time &
              mdash; semua dalam satu platform terintegrasi untuk Universitas
              Pembangunan Jaya.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <Link href="/login">
                <Button variant="whatsapp" size="xl" className="w-full sm:w-auto">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Pelajari Fitur
                </Button>
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mx-0">
            <div className="aspect-video rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-1">
              <div className="h-full w-full rounded-xl bg-slate-800/50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="h-3 flex-1 rounded bg-slate-700" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 rounded bg-slate-700" />
                  <div className="h-4 w-1/2 rounded bg-slate-700" />
                  <div className="h-20 rounded-lg border border-slate-700 bg-slate-800/50" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-700" />
                    <div className="h-8 flex-1 rounded bg-slate-700" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-48 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400">Terkirim</span>
                <span className="ml-auto text-sm font-bold text-emerald-400">
                  98.5%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div className="h-2 w-[98.5%] rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
