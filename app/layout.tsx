import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "WA Blast UPJ - Sistem Manajemen WhatsApp Marketing",
    template: "%s | WA Blast UPJ",
  },
  description:
    "Platform WhatsApp blast untuk efisiensi komunikasi marketing Universitas Pembangunan Jaya. Kelola kontak, buat & jadwalkan blast, pantau statistik real-time.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "WA Blast UPJ",
    description:
      "Sistem manajemen WhatsApp marketing untuk Universitas Pembangunan Jaya.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
