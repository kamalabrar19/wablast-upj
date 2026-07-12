import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Send,
  BarChart3,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Kelola Kontak",
    description:
      "Impor kontak via CSV, buat grup, dan validasi nomor WhatsApp otomatis. Database kontak terpusat dan mudah dicari.",
  },
  {
    icon: Send,
    title: "Buat & Jadwalkan Blast",
    description:
      "Wizard multi-step untuk membuat pesan, pilih target, dan atur jadwal pengiriman. Dukungan personalisasi dengan placeholder.",
  },
  {
    icon: BarChart3,
    title: "Statistik Real-time",
    description:
      "Pantau tingkat keberhasilan pengiriman, lihat tren, dan analisis data blast dalam dashboard visual yang informatif.",
  },
  {
    icon: Shield,
    title: "Keamanan Data",
    description:
      "Sistem role-based access control, session terkelola, dan enkripsi data. Hanya pengguna berwenang yang bisa mengakses data.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Fitur Unggulan
          </h2>
          <p className="mt-4 text-slate-400">
            Semua yang Anda butuhkan untuk mengelola kampanye WhatsApp marketing
            dalam satu platform.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-slate-800/50 transition-all duration-200 hover:border-whatsapp/30 hover:shadow-[0_0_24px_rgba(37,211,102,0.08)]"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-whatsapp/10 text-whatsapp transition-colors group-hover:bg-whatsapp/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
