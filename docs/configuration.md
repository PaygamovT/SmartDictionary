[← API Reference](api.md) · [Back to README](../README.md)

# Configuration

The application is highly configurable through the client-side `/settings` page. All settings are persisted in the browser.

## Client-Side Storage Keys

The following keys are stored in `localStorage`:

| Key | Purpose | Default |
|-----|---------|---------|
| `theme` | UI Theme (`dark` or `light`) | `dark` |
| `target_language` | Language for AI translations | `Russian` |
| `provider` | Active AI provider | `OpenRouter` |
| `{provider}_api_key` | Encrypted API key | `""` |
| `{provider}_base_url` | Custom Base URL for the provider | `""` |
| `{provider}_model_name` | Custom Model Name | varies |

*(Note: `{provider}` refers to the lowercase name of the provider, e.g., `openrouter_api_key`)*

## Security & Encryption

API keys are **never stored in plain text**. They are encrypted on the client side using the utility functions in `src/utils/crypto.ts` before being saved to `localStorage`. When a request is made to `/api/process`, the encrypted key is sent to the server, where it is decrypted in memory just before making the actual request to the AI provider.

## Custom Providers

You can define a "Custom" provider to point the application to any OpenAI-compatible API endpoint (e.g., a local LM Studio server or Ollama). Simply set the **Base URL** and **Model Name** in the AI Provider settings tab.

## See Also

- [Getting Started](getting-started.md) — Initial setup
- [API Reference](api.md) — How configurations are used in API requests
