import React from "react";
import "./App.css";
import { ScannerPanel } from "./components/ScanerPanel/ScannerPanel";
import { BookInfo } from "./components/BookInfo";
import { toBookInfo } from "./utils/toBookInfo";
import { IsbnGrid } from "./components/IsbnGrid";

function App() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any | null>(null);
  const [isbnHistory, setIsbnHistory] = React.useState<string[]>([]);

  const handleIsbnSubmit = async (isbn: string) => {
    const trimmed = isbn.trim();
    if (!trimmed) {
      setError("Please enter an ISBN.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(trimmed)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setResult(data);

      // Only record ISBNs for successful calls that return at least one item
      const hasItems = !!(data && typeof data === "object" && "items" in data && Array.isArray((data as any).items) && (data as any).items.length > 0);
      if (hasItems) {
        setIsbnHistory((prev) => (prev.includes(trimmed) ? prev : [trimmed, ...prev]));
      }
    } catch (e: any) {
      setError(e?.message ?? "Unknown error while fetching book data.");
    } finally {
      setLoading(false);
    }
  };

  const { book, resultPresent } = toBookInfo(result);

  return (
    <div className="grid3">
      <header className="panel header">
        <div className="header-title">ISBN SCANNER</div>
        <div className="header-controls">
          <ScannerPanel onSubmitIsbn={handleIsbnSubmit} />
        </div>
      </header>
      <main className="panel content">
        <div className="content-layout">
          <div className="content-left">
            <IsbnGrid items={isbnHistory} />
          </div>
          <div className="content-right">
            <BookInfo
              loading={loading}
              error={error}
              resultPresent={resultPresent}
              book={book}
            />
          </div>
        </div>
      </main>
      <footer className="panel footer"></footer>
    </div>
  );
}

export default App;
