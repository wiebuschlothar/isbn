import React from "react";
import "./App.css";
import { ScannerPanel } from "./components/ScanerPanel/ScannerPanel";
import { BookInfo } from "./components/BookInfo";
import { toBookInfo } from "./utils/toBookInfo";
import { IsbnGrid } from "./components/IsbnGrid";
import type { IsbnGridItem } from "./components/IsbnGrid";
import type { BookInfo as BookInfoType } from "./types/BookInfo";
import { loadScansFromLocalStorage, saveScansToLocalStorage, downloadScansAsJson, clearScansFromLocalStorage, readScansFromFile, mergeAndDedupeItems } from "./utils/persistence";

function App() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any | null>(null);
  const [scannedItems, setScannedItems] = React.useState<IsbnGridItem[]>([]);
  const [selectedBook, setSelectedBook] = React.useState<BookInfoType | null>(null);
  const [selectedIsbn, setSelectedIsbn] = React.useState<string | null>(null);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Load previously saved scans on first mount
  React.useEffect(() => {
    try {
      const saved = loadScansFromLocalStorage();
      if (saved && saved.length > 0) {
        setScannedItems(saved);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleIsbnSubmit = async (isbn: string) => {
    const trimmed = isbn.trim();
    if (!trimmed) {
      setError("Please enter an ISBN.");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedBook(null);
    setSelectedIsbn(null);
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
        const { book } = toBookInfo(data);
        setScannedItems((prev) => (prev.some((p) => p.isbn === trimmed) ? prev : [{ isbn: trimmed, book }, ...prev]));
      }
    } catch (e: any) {
      setError(e?.message ?? "Unknown error while fetching book data.");
    } finally {
      setLoading(false);
    }
  };

  const { book: fetchedBook, resultPresent: fetchedResultPresent } = toBookInfo(result);
  const viewBook = selectedBook ?? fetchedBook;
  const viewResultPresent = selectedBook ? true : fetchedResultPresent;

  const handleSelectItem = (item: IsbnGridItem) => {
    // When user clicks a history item, show its stored BookInfo immediately
    setLoading(false);
    setError(null);
    setSelectedBook(item.book ?? null);
    setSelectedIsbn(item.isbn);
  };

  const handleSave = () => {
    if (!scannedItems || scannedItems.length === 0) return;
    saveScansToLocalStorage(scannedItems);
    downloadScansAsJson(scannedItems);
    const when = new Date();
    setSaveMsg(`Saved ${scannedItems.length} item${scannedItems.length === 1 ? '' : 's'} at ${when.toLocaleTimeString()}`);
    window.clearTimeout((handleSave as any)._t);
    (handleSave as any)._t = window.setTimeout(() => setSaveMsg(null), 4000);
  };

  const handleClear = () => {
    if (!scannedItems || scannedItems.length === 0) return;
    const ok = window.confirm("Clear all stored scans? This will remove the saved list and selection.");
    if (!ok) return;
    try {
      clearScansFromLocalStorage();
    } catch (e) {
      // ignore; we also reset in-memory state below
    }
    setScannedItems([]);
    setSelectedBook(null);
    setSelectedIsbn(null);
    setResult(null);
    setError(null);
    setLoading(false);
    setSaveMsg("Cleared all stored scans.");
    window.clearTimeout((handleSave as any)._t);
    (handleSave as any)._t = window.setTimeout(() => setSaveMsg(null), 4000);
  };

  const handleImportClick = () => {
    if (importing) return;
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files && e.target.files[0];
    // Reset the input value so selecting the same file again will trigger onChange next time
    e.currentTarget.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const importedItems = await readScansFromFile(file);
      if (!importedItems || importedItems.length === 0) {
        setSaveMsg(`No valid items found in file \"${file.name}\".`);
      } else {
        const before = scannedItems.length;
        const merged = mergeAndDedupeItems(importedItems, scannedItems);
        const after = merged.length;
        const added = Math.max(0, after - before);
        setScannedItems(merged);
        // Persist merged list
        saveScansToLocalStorage(merged);
        // Clear current selection/result to avoid stale mismatch
        setSelectedBook(null);
        setSelectedIsbn(null);
        setResult(null);
        setError(null);
        setSaveMsg(`Imported ${importedItems.length} item${importedItems.length === 1 ? '' : 's'} from \"${file.name}\" (${added} new).`);
      }
    } catch (err: any) {
      setSaveMsg(err?.message ? `Import failed: ${err.message}` : "Import failed.");
    } finally {
      window.clearTimeout((handleSave as any)._t);
      (handleSave as any)._t = window.setTimeout(() => setSaveMsg(null), 4000);
      setImporting(false);
    }
  };

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
            <IsbnGrid items={scannedItems} onSelect={handleSelectItem} selectedIsbn={selectedIsbn ?? undefined} />
          </div>
          <div className="content-right">
            <BookInfo
              loading={loading}
              error={error}
              resultPresent={viewResultPresent}
              book={viewBook}
            />
          </div>
        </div>
      </main>
      <footer className="panel footer">
        <div className="footer-content">
          <button className="button-control" onClick={handleSave} disabled={scannedItems.length === 0}>
            Save
          </button>
          <button className="button-control" onClick={handleImportClick} disabled={importing} title="Import from a previously downloaded JSON file">
            {importing ? 'Importing…' : 'Import'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button className="button-control" onClick={handleClear} disabled={scannedItems.length === 0}>
            Clear
          </button>
          <div className="footer-status" role="status" aria-live="polite">
            {saveMsg}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
