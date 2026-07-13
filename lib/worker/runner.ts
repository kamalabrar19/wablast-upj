import { prisma } from "@/lib/db";
import { getWhatsAppProviderForUser } from "@/lib/whatsapp/provider";
import { restorePreviousSessions } from "@/lib/whatsapp/baileys-manager";

const POLL_INTERVAL = 5000;
let processing = false;

export async function processBlasts(): Promise<void> {
  if (processing) {
    console.log("[Worker] Already processing, skipping...");
    return;
  }
  processing = true;
  try {
    const pendingBlasts = await prisma.blast.findMany({
      where: { status: "sending" },
      include: {
        targets: {
          where: { status: "pending" },
          include: { contact: true },
          take: 50,
        },
        createdBy: { select: { id: true } },
      },
    });

    for (const blast of pendingBlasts) {
      console.log(`[Worker] Processing blast: ${blast.title} (${blast.id})`);

      if (blast.targets.length === 0) {
        const remaining = await prisma.blastTarget.count({
          where: { blastId: blast.id, status: "pending" },
        });
        if (remaining === 0) {
          await prisma.blast.update({
            where: { id: blast.id },
            data: { status: "completed" },
          });
          console.log(`[Worker] Blast completed: ${blast.title}`);
        }
        continue;
      }

      const provider = await getWhatsAppProviderForUser(blast.createdById);
      if (!provider) {
        console.log(`[Worker] No WA provider for user ${blast.createdById}, skipping`);
        continue;
      }

      for (const target of blast.targets) {
        let message = blast.messageTemplate;
        message = message.replace(/\{\{nama\}\}/g, target.contact.name);
        message = message.replace(/\{\{tanggal\}\}/g, new Date().toLocaleDateString("id-ID", {
          year: "numeric", month: "long", day: "numeric",
        }));

        const result = await provider.sendMessage({
          to: target.contact.phoneNumber,
          text: message,
          imageUrl: blast.imageUrl || undefined,
          footer: blast.footer || undefined,
        });

        if (result.success) {
          await prisma.blastTarget.update({
            where: { id: target.id },
            data: { status: "sent", sentAt: new Date() },
          });
          console.log(`[Worker] Sent to ${target.contact.phoneNumber}`);
        } else {
          await prisma.blastTarget.update({
            where: { id: target.id },
            data: { status: "failed", errorMessage: result.error },
          });
          console.log(`[Worker] Failed for ${target.contact.phoneNumber}: ${result.error}`);
        }

        await new Promise((resolve) => setTimeout(resolve, blast.delayMs || 3000));
      }

      const remaining = await prisma.blastTarget.count({
        where: { blastId: blast.id, status: "pending" },
      });
      if (remaining === 0) {
        await prisma.blast.update({
          where: { id: blast.id },
          data: { status: "completed" },
        });
        console.log(`[Worker] Blast completed: ${blast.title}`);
      }
    }
  } finally {
    processing = false;
  }
}

async function activateScheduledBlasts(): Promise<void> {
  const now = new Date();
  const dueBlasts = await prisma.blast.findMany({
    where: { status: "draft", scheduledAt: { lte: now } },
  });
  for (const blast of dueBlasts) {
    console.log(`[Worker] Activating scheduled blast: ${blast.title}`);
    await prisma.blast.update({
      where: { id: blast.id },
      data: { status: "sending" },
    });
  }
}

async function workerLoop(): Promise<void> {
  console.log("[Worker] Starting inline blast worker");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await activateScheduledBlasts();
      await processBlasts();
    } catch (err) {
      console.error("[Worker] Error:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

let started = false;

export async function ensureSessionsRestored(): Promise<void> {
  if (started) return;
  await restorePreviousSessions();
}

export function startBlastWorker(): void {
  if (started) return;
  started = true;
  restorePreviousSessions().catch(console.error);
  setTimeout(workerLoop, 0);
  console.log("[Worker] Inline blast worker scheduled");
}
