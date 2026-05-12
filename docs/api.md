[← Architecture](architecture.md) · [Back to README](../README.md) · [Configuration →](configuration.md)

# API Reference

The application uses Next.js Route Handlers to communicate securely with AI providers without exposing keys in the browser network tab (aside from the initial payload transmission to the server).

## `POST /api/process`

Extracts text from uploaded files and translates/analyzes it using the configured AI provider.

**Request Payload:**
```json
{
  "fileBase64": "data:image/png;base64,iVBORw0KGgo...",
  "fileType": "image/png",
  "text": "Manual text input",
  "encryptedKey": "U2FsdGVkX1...",
  "provider": "OpenRouter",
  "targetLanguage": "Russian",
  "baseUrl": "https://openrouter.ai/api/v1",
  "modelName": "google/gemini-3.1-flash-lite-preview"
}
```

**Response Format:**
```json
{
  "originalText": "The extracted text from the document.",
  "translations": [
    {
      "word": "extracted",
      "translation": "извлеченный",
      "context": "The extracted text..."
    }
  ]
}
```

## Provider Support

The endpoint dynamically adapts its payload structure based on the chosen `provider`. Currently supported:
- **OpenRouter**
- **Anthropic**
- **OpenAI**
- **MiniMax**
- **Custom** (Custom OpenAI-compatible endpoints)

## See Also

- [Architecture](architecture.md) — Understand where the API fits into the project
- [Configuration](configuration.md) — How the client configures the API
