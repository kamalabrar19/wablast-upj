import { prisma } from "@/lib/db";
import { makeWASocket, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { useMultiFileAuthState as loadAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import P from "pino";
import * as fs from "fs";
import * as path from "path";

interface ConnectionState {
  qr: string | null;
  connected: boolean;
  socket: ReturnType<typeof makeWASocket> | null;
  starting: boolean;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempts: number;
}

const connections = new Map<string, ConnectionState>();
const AUTH_DIR = path.join(process.cwd(), "wa_auth");
const logger = P({ level: "error" });

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

function removeSocketListeners(sock: ReturnType<typeof makeWASocket>): void {
  try {
    sock.ev.removeAllListeners("connection.update");
    sock.ev.removeAllListeners("creds.update");
  } catch {
    // ignore
  }
}

function scheduleReconnect(userId: string, delayMs: number): void {
  const existing = connections.get(userId);
  if (existing?.reconnectTimer) clearTimeout(existing.reconnectTimer);

  const timer = setTimeout(() => {
    const entry = connections.get(userId);
    if (entry) entry.reconnectTimer = null;
    connectWA(userId);
  }, delayMs);

  const entry = connections.get(userId);
  if (entry) entry.reconnectTimer = timer;
}

export async function connectWA(userId: string): Promise<void> {
  const existing = connections.get(userId);
  if (existing) {
    // Already starting or connected — skip
    if (existing.starting || existing.connected) return;
    // Clean up old socket
    if (existing.socket) {
      removeSocketListeners(existing.socket);
      try { existing.socket.end(undefined); } catch { /* ignore */ }
    }
    if (existing.reconnectTimer) {
      clearTimeout(existing.reconnectTimer);
    }
    connections.delete(userId);
  }

  const state: ConnectionState = {
    qr: null,
    connected: false,
    socket: null,
    starting: true,
    reconnectTimer: null,
    reconnectAttempts: 0,
  };
  connections.set(userId, state);

  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state: authState, saveCreds } = await loadAuthState(path.join(AUTH_DIR, userId));

    const sock = makeWASocket({
      version,
      auth: authState,
      printQRInTerminal: false,
      browser: ["WA Blast UPJ", "Chrome", "1.0.0"],
      logger,
    });

    state.socket = sock;
    state.starting = false;
    state.reconnectAttempts = 0;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ qr, connection, lastDisconnect }) => {
      // Abort if this socket is no longer the active one for this user
      const current = connections.get(userId);
      if (current?.socket !== sock) return;

      if (qr) {
        state.qr = qr;
      }

      if (connection === "open") {
        state.connected = true;
        state.qr = null;
        state.starting = false;
        state.reconnectAttempts = 0;

        await prisma.whatsAppSession.upsert({
          where: { userId },
          create: { userId, creds: JSON.stringify(authState.creds || {}), connected: true },
          update: { connected: true },
        });

        console.log(`[Baileys] User ${userId} connected`);
      }

      if (connection === "close") {
        const isLoggedOut =
          (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.loggedOut;

        console.log(`[Baileys] User ${userId} disconnected (loggedOut: ${isLoggedOut})`);

        state.connected = false;
        state.socket = null;
        state.qr = null;
        state.starting = false;

        removeSocketListeners(sock);

        await prisma.whatsAppSession.upsert({
          where: { userId },
          create: { userId, creds: "{}", connected: false },
          update: { connected: false },
        });

        if (isLoggedOut) {
          const userAuthDir = path.join(AUTH_DIR, userId);
          if (fs.existsSync(userAuthDir)) {
            fs.rmSync(userAuthDir, { recursive: true, force: true });
          }
          state.reconnectAttempts = 0;
          // Generate QR baru setelah 2 detik
          scheduleReconnect(userId, 2000);
        } else {
          // Backoff: 2s, 5s, 10s, 20s, max 60s
          const attempts = state.reconnectAttempts;
          const delay = Math.min(2000 * Math.pow(2, attempts), 60000);
          state.reconnectAttempts = attempts + 1;
          console.log(`[Baileys] Reconnecting ${userId} in ${delay}ms (attempt ${attempts + 1})`);
          scheduleReconnect(userId, delay);
        }
      }
    });
  } catch (err) {
    console.error(`Baileys init error for user ${userId}:`, err);
    state.starting = false;
    connections.delete(userId);
  }
}

export function getConnectionStatus(userId: string): {
  connected: boolean;
  qr: string | null;
  starting: boolean;
  exists: boolean;
} {
  const conn = connections.get(userId);
  return {
    connected: conn?.connected ?? false,
    qr: conn?.qr ?? null,
    starting: conn?.starting ?? false,
    exists: conn !== undefined,
  };
}

export function getBaileysSocket(
  userId: string
): ReturnType<typeof makeWASocket> | null {
  const conn = connections.get(userId);
  if (!conn?.connected || !conn.socket) return null;
  return conn.socket;
}

export async function restorePreviousSessions(): Promise<void> {
  try {
    const sessions = await prisma.whatsAppSession.findMany({
      where: { connected: true },
    });
    if (sessions.length > 0) {
      console.log(`[Baileys] Restoring ${sessions.length} previous session(s)`);
      for (const s of sessions) {
        connectWA(s.userId);
      }
    }
  } catch (err) {
    console.error("[Baileys] Failed to restore sessions:", err);
  }
}

export function cleanupConnection(userId: string) {
  const conn = connections.get(userId);
  if (conn) {
    if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);
    if (conn.socket) {
      removeSocketListeners(conn.socket);
      try { conn.socket.end(undefined); } catch { /* ignore */ }
    }
  }
  connections.delete(userId);
}
