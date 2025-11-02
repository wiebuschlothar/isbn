import React from "react";
import "./App.css";
import { ScannerPanel } from "./components/ScanerPanel/ScannerPanel";
import { BookInfo } from "./components/BookInfo";
import { toBookInfo } from "./utils/toBookInfo";

function App() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any | null>(null);

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
    } catch (e: any) {
      setError(e?.message ?? "Unknown error while fetching book data.");
    } finally {
      setLoading(false);
    }
  };

  const { book, resultPresent } = toBookInfo(result);

  return (
    <div className="grid3">
      <header className="panel header">Header (10%)</header>
      <main className="panel content">
        <BookInfo loading={loading} error={error} resultPresent={resultPresent} book={book} />
      </main>
      <footer className="panel footer">
        <ScannerPanel onSubmitIsbn={handleIsbnSubmit} />
      </footer>
    </div>
  );
}

export default App;
