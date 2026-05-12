[Back to README](../README.md) · [Architecture →](architecture.md)

# Getting Started

Follow these steps to set up the Interactive Dictionary locally.

## Prerequisites

- Node.js 18+ or later
- npm, yarn, pnpm, or bun

## Installation

1. **Clone the repository** (if not already cloned):
   ```bash
   git clone <repository-url>
   cd "interactive dictionary"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open the App**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## First Run

When you open the app for the first time:
1. Navigate to the **Settings** page via the left sidebar.
2. Select your preferred **Target Language** (e.g., Russian, Spanish).
3. Select an **AI Provider** (e.g., OpenRouter) and enter your API key. Keys are encrypted and stored securely in your browser's local storage.
4. Click **Save Settings**.
5. Navigate back to **Upload**, paste some text or upload a document, and click **Process Document**.

## See Also

- [Architecture](architecture.md) — Learn about the project's structure
- [Configuration](configuration.md) — Details on settings and API keys
