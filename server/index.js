// Simple Express server to persist scanned ISBN data to a local JSON file.
// Endpoints:
//   GET  /api/scans -> { version: 1, items: IsbnGridItem[] }
//   POST /api/scans -> accepts same shape, writes to disk, returns saved payload
//   second change 

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'scans.json');

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const readFileSafe = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      return { version: 1, items: [] };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return validatePayload(parsed);
  } catch (e) {
    console.error('Failed to read scans file:', e);
    return { version: 1, items: [] };
  }
};

const validatePayload = (payload) => {
  const out = { version: 1, items: [] };
  if (!payload || typeof payload !== 'object') return out;
  const version = typeof payload.version === 'number' ? payload.version : 1;
  const items = Array.isArray(payload.items) ? payload.items : [];
  out.version = version;
  out.items = items
    .map((it) => {
      if (!it || typeof it !== 'object') return null;
      const isbn = typeof it.isbn === 'string' ? it.isbn : null;
      const book = it.book && typeof it.book === 'object' ? sanitizeBook(it.book) : null;
      if (!isbn) return null;
      return { isbn, book };
    })
    .filter(Boolean);
  // de-duplicate by isbn, keep first occurrence
  const seen = new Set();
  out.items = out.items.filter((it) => {
    if (seen.has(it.isbn)) return false;
    seen.add(it.isbn);
    return true;
  });
  return out;
};

const sanitizeBook = (book) => {
  const pickStr = (v) => (typeof v === 'string' ? v : undefined);
  const pickNum = (v) => (typeof v === 'number' ? v : undefined);
  const pickStrArr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : undefined);
  return {
    title: pickStr(book.title),
    authors: pickStrArr(book.authors),
    publisher: pickStr(book.publisher),
    publishedDate: pickStr(book.publishedDate),
    pageCount: pickNum(book.pageCount),
    categories: pickStrArr(book.categories),
    description: pickStr(book.description),
    thumbnail: pickStr(book.thumbnail),
    buyLink: pickStr(book.buyLink),
  };
};

const writeFileSafe = (payload) => {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to write scans file:', e);
    return false;
  }
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/scans', (req, res) => {
  const data = readFileSafe();
  res.json(data);
});

app.post('/api/scans', (req, res) => {
  const validated = validatePayload(req.body);
  const ok = writeFileSafe(validated);
  if (!ok) {
    res.status(500).json({ error: 'Failed to save scans' });
    return;
  }
  res.json(validated);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
