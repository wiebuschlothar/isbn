import * as React from "react";

export interface IsbnGridProps {
  items: string[];
  title?: string;
}

export const IsbnGrid: React.FC<IsbnGridProps> = ({ items, title = "Scanned ISBNs" }) => {
  return (
    <div className="isbn-grid">
      <div className="isbn-grid__header">{title}</div>
      <div className="isbn-grid__body">
        {items.length === 0 ? (
          <div className="isbn-grid__empty">No successful scans yet.</div>
        ) : (
          items.map((isbn) => (
            <div key={isbn} className="isbn-grid__cell" title={isbn}>
              {isbn}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
