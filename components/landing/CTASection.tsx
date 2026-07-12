import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="border-t border-slate-800/50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950 p-8 sm:p-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Siap Mengoptimalkan Komunikasi Marketing UPJ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Mulai gunakan WA Blast UPJ sekarang dan rasakan efisiensi dalam
            menjangkau ribuan kontak dalam hitungan menit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button variant="whatsapp" size="xl">
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="xl">
                Pelajari Lebih Lanjut
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
