# 🧠 SmartDictionary

> **Turn any document into an interactive language learning experience.**

SmartDictionary is a high-performance, Next.js-powered Progressive Web App (PWA) designed to bridge the gap between reading and vocabulary acquisition. By leveraging state-of-the-art AI models, it transforms static PDFs, images, and text into interactive reading environments where every word is a learning opportunity.

---

## ✨ Key Features

- **🖼️ Multi-Format Extraction** — Upload PDFs, images (OCR), or paste raw text. SmartDictionary extracts content with precision, preserving structure and context.
- **🤖 Multi-Provider AI** — Seamlessly switch between top-tier AI providers:
  - **OpenRouter** (Gemini, Llama, etc.)
  - **Anthropic** (Claude 3.5 Sonnet)
  - **OpenAI** (GPT-4o)
  - **MiniMax** (Vision-capable processing via MCP)
- **📖 Interactive Reader** — Read extracted text with inline, contextual translations. Click any word to see its meaning in your target language without losing flow.
- **🗂️ Flashcard System** — Automatically save difficult words and study them using a built-in flashcard module.
- **📂 Document History** — Keep track of everything you've read with local persistence and easy renaming/management.
- **🔒 Privacy First** — Your API keys are encrypted and stored **only in your browser's local storage**. They are never saved on a server.
- **📱 PWA Support** — Install it on your desktop or mobile device for a native-like experience.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with modern Glassmorphism & Dark Mode
- **State/Storage**: IndexedDB (for documents) & LocalStorage (for settings)
- **AI Integration**: Model Context Protocol (MCP) & Standard REST APIs
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- An API key from one of the supported providers (e.g., OpenRouter, OpenAI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PaygamovT/SmartDictionary.git
   cd SmartDictionary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Configure the app**
   Open [http://localhost:3000](http://localhost:3000) and head to the **Settings** tab to enter your API key and choose your preferred AI model.

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.
