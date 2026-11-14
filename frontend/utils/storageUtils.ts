import { ChatMessage } from "../types/terminal";

const STORAGE_PREFIX = "bursa_terminal_chat_";

/**
 * Loads cached conversation messages for a specific stock code.
 */
export function getSavedChatHistory(stockCode: string): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${stockCode}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (e) {
    return null;
  }
}

/**
 * Persists chat messages for a specific stock code.
 */
export function saveChatHistory(stockCode: string, messages: ChatMessage[]) {
  if (typeof window === "undefined" || !stockCode) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${stockCode}`, JSON.stringify(messages));
  } catch (e) {}
}

/**
 * Identifies if a security is a financial/banking institution
 * where banking metrics (NIM, CIR, GIL, CET-1) apply instead of industrial gearing.
 */
export function isBankingSector(code: string, sector: string = ""): boolean {
  const bankCodes = new Set(["1155", "1023", "1295", "1066", "5819", "1015", "1818"]);
  if (bankCodes.has(code)) return true;
  const s = sector.toLowerCase();
  return s.includes("bank") || s.includes("financial service");
}
