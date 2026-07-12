import { Upload, MessageSquareText, BarChart } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Impor Kontak",
    description:
      "Upload daftar kontak via CSV atau tambah manual. Kelompokkan berdasarkan kategori untuk penargetan yang lebih tepat.",
    step: "01",
  },
  {
    icon: MessageSquareText,
    title: "Buat Pesan",
    description:
      "Tulis pesan WhatsApp yang ingin dikirim. Gunakan placeholder seperti {{nama}} untuk personalisasi otomatis.",
    step: "02",
  },
  {
    icon: BarChart,
    title: "Kirim & Pantau",
    description:
      "Jadwalkan pengiriman atau kirim langsung. Pantau status real-time, lihat laporan, dan analisis hasil kampanye.",
    step: "03",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-slate-800/50 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Cara Kerja
          </h2>
          <p className="mt-4 text-slate-400">
            Tiga langkah sederhana untuk memulai kampanye WhatsApp marketing.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-[60%] hidden h-[2px] w-[40%] bg-gradient-to-r from-whatsapp/40 to-transparent md:block" />
              )}
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-whatsapp/10">
                <step.icon className="h-10 w-10 text-whatsapp" />
              </div>
              <span className="mb-2 block text-sm font-medium text-whatsapp">
                Langkah {step.step}
              </span>
              <h3 className="mb-3 text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
