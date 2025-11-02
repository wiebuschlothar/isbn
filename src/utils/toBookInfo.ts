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

  const book: BookInfo = {
    title: typeof vi.title === "string" ? vi.title : undefined,
    authors: Array.isArray(vi.authors) ? (vi.authors as unknown[]).filter((a): a is string => typeof a === "string") : undefined,
    publisher: typeof vi.publisher === "string" ? vi.publisher : undefined,
    publishedDate: typeof vi.publishedDate === "string" ? vi.publishedDate : undefined,
    pageCount: typeof vi.pageCount === "number" ? (vi.pageCount as number) : undefined,
    categories: Array.isArray(vi.categories) ? (vi.categories as unknown[]).filter((c): c is string => typeof c === "string") : undefined,
    description: typeof vi.description === "string" ? vi.description : undefined,
    thumbnail: imageLinks && typeof imageLinks.thumbnail === "string" ? (imageLinks.thumbnail as string) : undefined,
    buyLink: typeof si.buyLink === "string" ? (si.buyLink as string) : undefined,
  };

  return { book, resultPresent };
}
