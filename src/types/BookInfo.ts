// Domain type representing the data we actually show in the BookInfo component
// (derived from Google Books API response but trimmed to the fields we render)

export interface BookInfo {
  // Basic metadata
  title?: string;
  authors?: string[]; // e.g., ["Author One", "Author Two"]
  publisher?: string;
  publishedDate?: string; // e.g., "2017-05-23" or "2017"
  pageCount?: number; // total number of pages
  categories?: string[]; // e.g., ["Fiction", "Thriller"]

  // Description/summary
  description?: string;

  // Media
  thumbnail?: string; // URL for the small/thumbnail cover image

  // External links
  buyLink?: string; // e.g., Google Books buy/view link
}

// Notes:
// - This is a small, UI-focused type. It intentionally avoids all of the
//   Google Books API's full schema and only contains fields the UI uses.
// - If you need a mapper from the raw Google Books API response to this type,
//   we can add a small helper like `toBookInfo(apiResult): BookInfo | null`.