import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getConnectionStatus } from "@/lib/whatsapp/baileys-manager";
import { isWAConnected } from "@/lib/whatsapp/connection";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = getConnectionStatus(session.user.id);

  // Prioritaskan in-memory state
  if (status.connected) {
    return NextResponse.json({ connected: true });
  }

  if (status.qr) {
    const qrImage = await QRCode.toDataURL(status.qr, {
      width: 300,
      margin: 2,
      color: { dark: "#111827", light: "#ffffff" },
    });
    return NextResponse.json({ qr: qrImage });
  }

  // Fallback ke DB hanya kalau tidak ada entry di in-memory Map
  if (!status.exists) {
    const dbConnected = await isWAConnected(session.user.id);
    if (dbConnected) {
      return NextResponse.json({ connected: true });
    }
  }

  return NextResponse.json({
    qr: null,
    starting: status.starting,
    message: status.starting ? "Menghubungkan ke WhatsApp..." : "Menunggu QR code...",
  });
}
