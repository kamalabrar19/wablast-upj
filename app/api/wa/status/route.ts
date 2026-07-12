import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { isWAConnected } from "@/lib/whatsapp/connection";
import { getConnectionStatus } from "@/lib/whatsapp/baileys-manager";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ connected: false, starting: false, hasQR: false });
  }

  const [dbConnected, memStatus] = await Promise.all([
    isWAConnected(session.user.id),
    getConnectionStatus(session.user.id),
  ]);

  // Prioritaskan in-memory state (real-time). DB hanya fallback kalau tidak ada entry di Map.
  const connected = memStatus.connected || (!memStatus.exists && dbConnected);

  return NextResponse.json({
    connected,
    starting: memStatus.starting,
    hasQR: !!memStatus.qr,
  });
}
