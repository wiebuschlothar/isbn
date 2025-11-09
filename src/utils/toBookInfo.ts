import type { BookInfo } from "../types/BookInfo";

// Minimal, defensive mapper from the Google Books API result to our UI type.
// It intentionally uses type narrowing and runtime checks to avoid relying on `any`.
export function toBookInfo(result: unknown): { book: BookInfo | null; resultPresent: boolean } {
  const resultPresent = !!result;

  // Try to access result.items safely
  const items = ((): unknown[] | undefined => {
    if (result && typeof result === "object" && "items" in result) {
      const maybeItems = (result as { items?: unknown }).items;
      if (Array.isArray(maybeItems)) return maybeItems;
    }
    return undefined;
  })();

  const first = items && items.length > 0 ? (items[0] as unknown) : null;

  if (!first || typeof first !== "object") {
    return { book: null, resultPresent };
  }

  const volumeInfo = (first as { volumeInfo?: unknown }).volumeInfo;
  const saleInfo = (first as { saleInfo?: unknown }).saleInfo;

  const vi = (volumeInfo && typeof volumeInfo === "object") ? (volumeInfo as Record<string, unknown>) : {};
  const si = (saleInfo && typeof saleInfo === "object") ? (saleInfo as Record<string, unknown>) : {};

  const imageLinks = (vi.imageLinks && typeof vi.imageLinks === "object") ? (vi.imageLinks as Record<string, unknown>) : undefined;

  // Small helpers to make assignments concise and consistent
  const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
  const asNumber = (v: unknown): number | undefined => (typeof v === "number" ? (v as number) : undefined);
  const asStringArray = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? (v as unknown[]).filter((a): a is string => typeof a === "string") : undefined;

  const pick = (obj: Record<string, unknown> | undefined, key: string): unknown => (obj ? obj[key] : undefined);

  const book: BookInfo = {
    title: asString(vi.title),
    authors: asStringArray(vi.authors),
    publisher: asString(vi.publisher),
    publishedDate: asString(vi.publishedDate),
    pageCount: asNumber(vi.pageCount),
    categories: asStringArray(vi.categories),
    description: asString(vi.description),
    thumbnail: asString(pick(imageLinks, "thumbnail")),
    buyLink: asString(si.buyLink),
  };

  return { book, resultPresent };
}
