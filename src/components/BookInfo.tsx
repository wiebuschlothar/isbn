import React from "react";
import type { BookInfo as BookInfoType } from "../types/BookInfo";
import "./BookInfo.css";

export interface BookInfoProps {
  loading: boolean;
  error: string | null;
  // Indicates that a request was performed and returned (used to show "No books found")
  resultPresent: boolean;
  // Strongly-typed, UI-focused book data
  book: BookInfoType | null;
}

export const BookInfo: React.FC<BookInfoProps> = ({ loading, error, resultPresent, book }) => {
  return (
    <div className="bookInfo">
      {loading && <div>Loading…</div>}
      {error && (
        <div className="bookInfo__error">Error: {error}</div>
      )}
      {resultPresent && !book && !loading && !error && (
        <div>No books found for the provided ISBN.</div>
      )}
      {book && !loading && !error && (
        <div className="bookInfo__row">
          {book.thumbnail && (
            <img
              className="bookInfo__thumb"
              src={book.thumbnail}
              alt={book.title ?? "Book cover"}
            />
          )}
          <div>
            <div className="bookInfo__title">{book.title}</div>
            {book.authors && (
              <div className="bookInfo__authors">by {book.authors.join(", ")}</div>
            )}
            {(book.publisher || book.publishedDate || book.pageCount) && (
              <div className="bookInfo__meta">
                {[book.publisher, book.publishedDate, (typeof book.pageCount === "number" ? `${book.pageCount} pages` : undefined)]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
            )}
            {book.categories && book.categories.length > 0 && (
              <div className="bookInfo__categories">
                Categories: {book.categories.join(", ")}
              </div>
            )}
            {book.description && (
              <p className="bookInfo__desc">
                {String(book.description).slice(0, 360)}
                {String(book.description).length > 360 ? "…" : ""}
              </p>
            )}
            {book.buyLink && (
              <div className="bookInfo__buy">
                <a href={book.buyLink} target="_blank" rel="noreferrer">
                  View on Google Books
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
