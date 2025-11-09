import * as React from "react";
import type { BookInfo } from "../types/BookInfo";

export interface IsbnGridItem {
  isbn: string;
  book: BookInfo | null;
}

export interface IsbnGridProps {
  items: IsbnGridItem[];
  title?: string;
  onSelect?: (item: IsbnGridItem) => void;
  selectedIsbn?: string;
}

export const IsbnGrid: React.FC<IsbnGridProps> = ({ items, title = "Scanned ISBNs", onSelect, selectedIsbn }) => {
  return (
    <div className="isbn-grid">
      <div className="isbn-grid__header">{title}</div>
      <div className="isbn-grid__body">
        {items.length === 0 ? (
          <div className="isbn-grid__empty">No successful scans yet.</div>
        ) : (
          items.map((item) => {
            const isSelected = selectedIsbn === item.isbn;
            return (
              <div
                key={item.isbn}
                className={`isbn-grid__cell isbn-grid__cell--clickable${isSelected ? " isbn-grid__cell--selected" : ""}`}
                title={item.isbn}
                role="button"
                aria-current={isSelected ? "true" : undefined}
                tabIndex={0}
                onClick={() => onSelect?.(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect?.(item);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {item.isbn}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
