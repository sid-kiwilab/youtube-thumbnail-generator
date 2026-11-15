/**
 * Ping t.me/youtube_editor_ai_bot when Groq / OpenAI / OpenRouter credits die.
 *
 *   node scripts/telegram-notify.mjs --discover
 *   node scripts/telegram-notify.mjs --test
 *   node scripts/telegram-notify.mjs "message"
 *
 * Needs TELEGRAM_BOT_TOKEN in .env. After you tap Start on the bot,
 * --discover writes TELEGRAM_CHAT_ID.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const ENV_PATH = join(REPO_ROOT, ".env");

export function loadEnv() {
  if (!existsSync(ENV_PATH)) return;
  for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

export function isQuotaError(err) {
  const status = Number(err?.status ?? err?.statusCode ?? err?.response?.status ?? 0);
  const code = String(err?.code ?? err?.error?.code ?? "");
  const msg = `${err?.message ?? ""} ${err?.error?.message ?? ""} ${code}`.toLowerCase();
  if (status === 429 || status === 402) return true;
  return /insufficient_quota|quota.?exceeded|rate.?limit|out of credits|credit.?limit|payment.?required|billing|tokens? exhausted|too many requests/.test(
    msg,
  );
}

export function guessVendor(err, fallback = "api") {
  const blob = `${err?.message ?? ""} ${err?.error?.message ?? ""} ${err?.url ?? ""}`.toLowerCase();
  if (blob.includes("openrouter") || blob.includes("openrouter.ai")) return "openrouter";
  if (blob.includes("groq")) return "groq";
  if (blob.includes("openai") || blob.includes("whisper")) return "openai";
  return fallback;
}

function botToken() {
  loadEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN in .env");
  return token;
}

function apiUrl(method) {
  return `https://api.telegram.org/bot${botToken()}/${method}`;
}

async function telegramJson(method, payload) {
  const res = await fetch(apiUrl(method), {
    method: payload ? "POST" : "GET",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.description || `Telegram ${method} failed (${res.status})`);
  }
  return data.result;
}

export function persistChatId(chatId) {
  const id = String(chatId).trim();
  if (!/^-?\d+$/.test(id)) throw new Error(`Bad TELEGRAM_CHAT_ID: ${id}`);
  let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  if (/^TELEGRAM_CHAT_ID=/m.test(text)) {
    text = text.replace(/^TELEGRAM_CHAT_ID=.*$/m, `TELEGRAM_CHAT_ID=${id}`);
  } else {
    if (text && !text.endsWith("\n")) text += "\n";
    text += `TELEGRAM_CHAT_ID=${id}\n`;
  }
  writeFileSync(ENV_PATH, text);
  process.env.TELEGRAM_CHAT_ID = id;
}

export async function discoverChatId() {
  const updates = await telegramJson("getUpdates");
  const chats = [];
  for (const u of updates || []) {
    const chat = u.message?.chat || u.my_chat_member?.chat;
    if (chat?.id != null) chats.push(chat);
  }
  if (!chats.length) {
    throw new Error(
      "No Telegram chat yet. Open t.me/youtube_editor_ai_bot, tap Start, then rerun --discover.",
    );
  }
  const chat = chats[chats.length - 1];
  persistChatId(chat.id);
  return chat;
}

async function chatIdOrDiscover() {
  loadEnv();
  let chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) {
    const chat = await discoverChatId();
    chatId = String(chat.id);
  }
  return chatId;
}

export async function sendTelegram(text) {
  const chatId = await chatIdOrDiscover();
  const body = String(text || "").slice(0, 4000);
  if (!body) throw new Error("Empty Telegram message");
  await telegramJson("sendMessage", { chat_id: chatId, text: body });
}

export async function notifyQuota(err, vendor) {
  if (!isQuotaError(err)) return false;
  const who = guessVendor(err, vendor || "api");
  const detail = String(err?.error?.message || err?.message || err).slice(0, 500);
  try {
    await sendTelegram(
      `API credits/quota hit: ${who}\n${detail}\n\nTop up Groq / OpenAI / OpenRouter, then rerun.`,
    );
    console.error(`Telegram ping sent (${who} quota).`);
  } catch (notifyErr) {
    console.error(`Telegram ping failed: ${notifyErr.message || notifyErr}`);
  }
  return true;
}

export async function withQuotaNotify(vendor, fn) {
  try {
    return await fn();
  } catch (err) {
    await notifyQuota(err, vendor);
    throw err;
  }
}

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  if (args[0] === "--discover") {
    const chat = await discoverChatId();
    console.log(`Saved TELEGRAM_CHAT_ID for @${chat.username || chat.first_name || chat.id}`);
    return;
  }
  if (args[0] === "--test") {
    await sendTelegram("youtube_editor_ai_bot is live. I'll ping here if Groq / OpenAI / OpenRouter credits run out.");
    console.log("Test ping sent.");
    return;
  }
  const message = args.join(" ").trim();
  if (!message) {
    throw new Error(
      'Usage: node scripts/telegram-notify.mjs --discover | --test | "message"',
    );
  }
  await sendTelegram(message);
  console.log("Sent.");
}

const isDirect =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
