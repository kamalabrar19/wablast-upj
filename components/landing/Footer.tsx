import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-slate-800/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-whatsapp">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">
                WA Blast <span className="text-whatsapp">UPJ</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Platform WhatsApp blast untuk efisiensi komunikasi marketing
              Universitas Pembangunan Jaya.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Fitur</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Kelola Kontak</li>
              <li>Buat Blast</li>
              <li>Jadwal Pengiriman</li>
              <li>Statistik</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Kontak</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Universitas Pembangunan Jaya</li>
              <li>Email: info@upj.ac.id</li>
              <li>Telp: (021) 1234 5678</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800/50 pt-6 text-center text-sm text-slate-600">
          &copy; {new Date().getFullYear()} Universitas Pembangunan Jaya. All
          rights reserved.
        </div>
      </div>
    </footer>
  );
}
