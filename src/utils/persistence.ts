import type { IsbnGridItem } from "../components/IsbnGrid";

// LocalStorage key and payload schema version
const STORAGE_KEY = "isbn:scans:v1" as const;

export interface ScansPayloadV1 {
  version: 1;
  items: IsbnGridItem[];
}

function sanitizeItem(it: any): IsbnGridItem | null {
  if (!it || typeof it !== "object") return null;
  const isbn = typeof it.isbn === "string" ? it.isbn : null;
  if (!isbn) return null;
  const book = it.book && typeof it.book === "object" ? sanitizeBook(it.book) : null;
  return { isbn, book };
}

function sanitizeBook(book: any) {
  const str = (v: any) => (typeof v === "string" ? v : undefined);
  const num = (v: any) => (typeof v === "number" ? v : undefined);
  const strArr = (v: any) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : undefined);
  return {
    title: str(book.title),
    authors: strArr(book.authors),
    publisher: str(book.publisher),
    publishedDate: str(book.publishedDate),
    pageCount: num(book.pageCount),
    categories: strArr(book.categories),
    description: str(book.description),
    thumbnail: str(book.thumbnail),
    buyLink: str(book.buyLink),
  };
}

function dedupe(items: IsbnGridItem[]): IsbnGridItem[] {
  const seen = new Set<string>();
  const out: IsbnGridItem[] = [];
  for (const it of items) {
    if (!seen.has(it.isbn)) {
      seen.add(it.isbn);
      out.push(it);
    }
  }
  return out;
}

export function saveScansToLocalStorage(items: IsbnGridItem[]): void {
  const payload: ScansPayloadV1 = { version: 1, items: dedupe(items) };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to save scans to localStorage", e);
  }
}

export function loadScansFromLocalStorage(): IsbnGridItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return [];
    // accept version but ignore for now; reserved for future migrations
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const cleaned = items.map(sanitizeItem).filter(Boolean) as IsbnGridItem[];
    return dedupe(cleaned);
  } catch (e) {
    console.warn("Failed to load scans from localStorage", e);
    return [];
  }
}

export function downloadScansAsJson(items: IsbnGridItem[], now: Date = new Date()): void {
  const payload: ScansPayloadV1 = { version: 1, items: dedupe(items) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = formatTimestamp(now);
  a.href = url;
  a.download = `isbn-scans-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatTimestamp(d: Date): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

export function clearScansFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear scans from localStorage", e);
  }
}

// --- Import helpers ---
export function parseScansPayload(input: unknown): IsbnGridItem[] {
  // Accept either a full payload { version, items } or a bare array of items
  if (Array.isArray(input)) {
    return dedupe(input.map(sanitizeItem).filter(Boolean) as IsbnGridItem[]);
  }
  if (input && typeof input === "object") {
    const items = Array.isArray((input as any).items) ? (input as any).items : [];
    const cleaned = items.map(sanitizeItem).filter(Boolean) as IsbnGridItem[];
    return dedupe(cleaned);
  }
  return [];
}

export async function readScansFromFile(file: File): Promise<IsbnGridItem[]> {
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    return parseScansPayload(json);
  } catch (e) {
    console.warn("Failed to parse JSON file while importing scans", e);
    throw new Error("Invalid JSON file.");
  }
}

export function mergeAndDedupeItems(imported: IsbnGridItem[], existing: IsbnGridItem[]): IsbnGridItem[] {
  // Imported first, then existing. dedupe keeps the first occurrence, so imported wins.
  return dedupe([...(imported || []), ...(existing || [])]);
}
