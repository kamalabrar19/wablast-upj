import type { makeWASocket } from "@whiskeysockets/baileys";
import type { WhatsAppProvider, WhatsAppMessage, WhatsAppResult } from "./provider";

export class BaileysProvider implements WhatsAppProvider {
  constructor(private sock: Awaited<ReturnType<typeof makeWASocket>>) {}

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResult> {
    try {
      const jid = message.to.includes("@")
        ? message.to
        : `${message.to}@s.whatsapp.net`;

      const result = await this.sock.sendMessage(jid, { text: message.text });

      return {
        success: true,
        messageId: result?.key?.id ?? undefined,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown Baileys error",
      };
    }
  }

  async sendBulk(messages: WhatsAppMessage[]): Promise<WhatsAppResult[]> {
    const results: WhatsAppResult[] = [];
    for (const msg of messages) {
      results.push(await this.sendMessage(msg));
    }
    return results;
  }
}
