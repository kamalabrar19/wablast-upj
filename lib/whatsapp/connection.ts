/**
 * WhatsApp Connection Manager (Baileys)
 *
 * Mengelola koneksi WhatsApp via Baileys WebSocket.
 * Menyimpan credentials di database untuk persistensi session.
 */

import { prisma } from "@/lib/db";

// In-memory store untuk event emitter (QR code events)
type QREventHandler = (qr: string) => void;
const qrListeners = new Map<string, QREventHandler>();

export async function getWAConnection(userId: string) {
  return prisma.whatsAppSession.findUnique({
    where: { userId },
  });
}

export async function isWAConnected(userId: string): Promise<boolean> {
  const session = await getWAConnection(userId);
  return session?.connected ?? false;
}

export async function getCreds(userId: string): Promise<string | null> {
  const session = await getWAConnection(userId);
  return session?.creds ?? null;
}

export async function saveCreds(userId: string, creds: string) {
  await prisma.whatsAppSession.upsert({
    where: { userId },
    create: { userId, creds, connected: false },
    update: { creds, connected: false },
  });
}

export async function markConnected(userId: string) {
  await prisma.whatsAppSession.upsert({
    where: { userId },
    create: { userId, creds: "{}", connected: true },
    update: { connected: true },
  });
}

export async function markDisconnected(userId: string) {
  await prisma.whatsAppSession.update({
    where: { userId },
    data: { connected: false },
  });
}

// QR code event management
export function registerQRListener(
  userId: string,
  handler: QREventHandler
) {
  qrListeners.set(userId, handler);
  return () => qrListeners.delete(userId);
}

export function emitQR(userId: string, qr: string) {
  const handler = qrListeners.get(userId);
  if (handler) handler(qr);
}

export function removeQRListener(userId: string) {
  qrListeners.delete(userId);
}

/**
 * Catatan: Implementasi Baileys sebenarnya perlu WebSocket.
 * Untuk MVP, kita simulasikan QR code flow.
 * TODO: Implementasi Baileys actual Socket connection
 *
 * import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
 *
 * async function startBaileys(userId: string) {
 *   const { state, saveCreds: save } = await useMultiFileAuthState(`wa_auth/${userId}`);
 *
 *   const sock = makeWASocket({
 *     auth: state,
 *     printQRInTerminal: false,
 *   });
 *
 *   sock.ev.on("creds.update", save);
 *
 *   sock.ev.on("connection.update", async ({ qr, connection, lastDisconnect }) => {
 *     if (qr) emitQR(userId, qr);
 *     if (connection === "open") await markConnected(userId);
 *     if (connection === "close") {
 *       const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
 *       if (shouldReconnect) startBaileys(userId);
 *       else await markDisconnected(userId);
 *     }
 *   });
 *
 *   return sock;
 * }
 */
