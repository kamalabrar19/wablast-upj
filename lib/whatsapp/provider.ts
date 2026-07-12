/**
 * WhatsApp Provider Abstraction Layer
 *
 * Provider saat ini: Generic REST (Fonnte/Wablas-like)
 * TODO: Implement Meta WhatsApp Cloud API provider
 *       - Ganti implementasi di bawah dengan Meta Cloud API
 *       - Tambah provider baru di folder ini, jangan ubah interface
 */

export interface WhatsAppMessage {
  to: string;
  text: string;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  sendMessage(message: WhatsAppMessage): Promise<WhatsAppResult>;
  sendBulk(messages: WhatsAppMessage[]): Promise<WhatsAppResult[]>;
}

export async function getWhatsAppProviderForUser(
  userId: string
): Promise<WhatsAppProvider | null> {
  try {
    const { getBaileysSocket } = await import("./baileys-manager");
    const sock = getBaileysSocket(userId);
    if (sock) {
      const { BaileysProvider } = await import("./baileys-provider");
      return new BaileysProvider(sock);
    }
  } catch {
    // Fall through to null
  }
  return null;
}

class GenericRESTProvider implements WhatsAppProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.WA_API_KEY || "";
    this.baseUrl = process.env.WA_API_BASE_URL || "";
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResult> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          target: message.to,
          message: message.text,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.id || data.message_id,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async sendBulk(messages: WhatsAppMessage[]): Promise<WhatsAppResult[]> {
    const results: WhatsAppResult[] = [];
    for (const msg of messages) {
      const result = await this.sendMessage(msg);
      results.push(result);
      const delayMs = parseInt(process.env.BLAST_DELAY_MS || "4000", 10);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return results;
  }
}

let provider: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!provider) {
    provider = new GenericRESTProvider();
  }
  return provider;
}

/**
 * Contoh implementasi Meta WhatsApp Cloud API (belum aktif):
 *
 * class MetaCloudAPIProvider implements WhatsAppProvider {
 *   private phoneNumberId: string;
 *   private accessToken: string;
 *
 *   constructor() {
 *     this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || "";
 *     this.accessToken = process.env.META_ACCESS_TOKEN || "";
 *   }
 *
 *   async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResult> {
 *     const response = await fetch(
 *       `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
 *       {
 *         method: "POST",
 *         headers: {
 *           "Content-Type": "application/json",
 *           Authorization: `Bearer ${this.accessToken}`,
 *         },
 *         body: JSON.stringify({
 *           messaging_product: "whatsapp",
 *           to: message.to,
 *           type: "text",
 *           text: { body: message.text },
 *         }),
 *       }
 *     );
 *     // ... handle response
 *   }
 * }
 */
