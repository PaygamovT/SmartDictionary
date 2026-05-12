[← Getting Started](getting-started.md) · [Back to README](../README.md) · [API Reference →](api.md)

# Architecture

Interactive Dictionary is built on a modern stack emphasizing local processing, offline capabilities (PWA), and a flexible AI provider system.

## High-Level Overview

- **Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS with CSS Variables (`globals.css`)
- **Storage**: IndexedDB (via `db.ts`) for document history, and `localStorage` for user settings/keys
- **Icons**: Lucide React
- **Document Processing**: `pdf-parse` for PDFs, native FileReader for images/text

## Directory Structure

```text
src/
├── app/
│   ├── api/          # Next.js API Routes (Server-side)
│   ├── flashcards/   # Flashcard studying interface
│   ├── history/      # Processed document history
│   ├── reader/       # Interactive document reader
│   ├── settings/     # App configuration and API keys
│   ├── layout.tsx    # Main layout with left vertical sidebar
│   ├── page.tsx      # Upload / Chat-style input interface
│   └── globals.css   # Global design system and themes
├── utils/
│   ├── crypto.ts     # Client-side API key encryption
│   ├── db.ts         # IndexedDB wrapper for history
│   └── parser.ts     # Document text parsing and chunking
```

## Storage Patterns

1. **IndexedDB (`db.ts`)**: Used to store potentially large processed documents. Features include `saveHistoryItem`, `getHistoryItems`, `deleteHistoryItem`, and `renameHistoryItem`.
2. **Local Storage**: Used for lightweight, synchronous data like API keys (encrypted), selected provider, target language, and UI theme.

## See Also

- [Getting Started](getting-started.md) — Setup instructions
- [API Reference](api.md) — Backend API details
