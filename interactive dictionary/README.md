# Interactive Dictionary

> A Next.js-powered Progressive Web App for AI-assisted language learning.

Interactive Dictionary allows you to upload documents or paste text to extract, translate, and learn words in context using multiple AI providers (OpenRouter, Anthropic, OpenAI, MiniMax). It features a built-in interactive reader, flashcards, and a dedicated document history.

## Quick Start

```bash
npm install
npm run dev
```

## Key Features

- **Multi-Provider AI** — Support for OpenRouter, Anthropic, OpenAI, and MiniMax
- **Contextual Learning** — Upload PDFs, images, or text to extract words with coordinates
- **Flashcards** — Built-in flashcard system to study extracted words
- **Local Privacy** — API keys are encrypted and stored locally in your browser
- **PWA Ready** — Designed as a progressive web app for a native-like experience

## Example

```typescript
// Seamlessly switch between AI models in your settings
const provider = localStorage.getItem("provider") || "OpenRouter";
const targetLanguage = localStorage.getItem("target_language") || "Russian";

// Upload a document and get a fully parsed, interactive reading experience
```

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Installation, setup, first steps |
| [Architecture](docs/architecture.md) | Project structure and patterns |
| [API Reference](docs/api.md) | Endpoints, request/response formats |
| [Configuration](docs/configuration.md) | Environment variables, config files |

## License

MIT
