import { NextRequest, NextResponse } from "next/server";
import { decryptKey } from "@/utils/crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
// pdf-parse v1.x runs a test PDF on import when required normally — causes ENOENT crash.
// Import directly from the internal module to bypass that behavior.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number }> = require("pdf-parse/lib/pdf-parse.js");

// ─── PDF Text Cleanup (Task 3) ───────────────────────────────────────────────
function cleanPdfText(raw: string): string {
  console.log(`[PDF] Cleaning raw PDF text (${raw.length} chars)...`);
  const cleaned = raw
    // Remove hyphenation at line breaks (e.g. "impor-\ntant" → "important")
    .replace(/(\w)-\r?\n(\w)/g, '$1$2')
    // Normalize Windows line endings
    .replace(/\r\n/g, '\n')
    // Collapse 3+ newlines into paragraph break
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces/tabs into single space
    .replace(/[ \t]{2,}/g, ' ')
    // Remove trailing whitespace on each line
    .replace(/[^\S\n]+$/gm, '')
    // Remove non-printable control characters (except \n and \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();

  console.log(`[PDF] Cleaned text: ${cleaned.length} chars (removed ${raw.length - cleaned.length} chars)`);
  return cleaned;
}

// ─── Text Chunking (Task 3) ───────────────────────────────────────────────────
const MAX_CHUNK_CHARS = 4000;

function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > MAX_CHUNK_CHARS && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  console.log(`[PDF] Chunked text into ${chunks.length} chunks (max ${MAX_CHUNK_CHARS} chars each)`);
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    let { 
      fileBase64, 
      text, 
      encryptedKey, 
      provider = "OpenRouter", 
      targetLanguage = "Russian",
      baseUrl,
      modelName
    } = await req.json();

    console.log(`[ROUTE] Request received. Provider: ${provider}, hasFile: ${!!fileBase64}, hasText: ${!!text}, targetLanguage: ${targetLanguage}`);

    // If the user uploaded a text file, decode it and append to the text prompt instead of treating it as an image
    if (fileBase64 && fileBase64.startsWith("data:text/")) {
      const matches = fileBase64.match(/^data:text\/[a-zA-Z0-9-.+]+;base64,(.+)$/);
      if (matches) {
        const decodedText = Buffer.from(matches[1], "base64").toString("utf-8");
        text = text ? `${text}\n\n${decodedText}` : decodedText;
        fileBase64 = ""; // Clear fileBase64 so it isn't processed as an image
        console.log("[ROUTE] Decoded text file upload into text prompt.");
      }
    }

    // If the user uploaded a PDF, extract text with pdf-parse and treat as text
    if (fileBase64 && fileBase64.startsWith("data:application/pdf")) {
      console.log("[ROUTE] PDF detected — extracting text with pdf-parse...");
      try {
        const pdfMatch = fileBase64.match(/^data:application\/pdf;base64,(.+)$/);
        if (pdfMatch) {
          const pdfBuffer = Buffer.from(pdfMatch[1], "base64");
          const pdfData = await pdfParse(pdfBuffer);
          const rawText = pdfData.text?.trim();
          if (rawText) {
            // Task 3: Clean the extracted PDF text before appending
            const extractedText = cleanPdfText(rawText);
            text = text ? `${text}\n\n${extractedText}` : extractedText;
            fileBase64 = ""; // Clear fileBase64 so it isn't processed as an image
            console.log(`[ROUTE] PDF extraction complete: ${pdfData.numpages} pages, ${rawText.length} raw chars → ${extractedText.length} cleaned chars.`);
          } else {
            // PDF has no extractable text (scanned image PDF) — keep fileBase64 for vision processing
            console.log("[ROUTE] PDF has no extractable text — will attempt vision processing.");
          }
        }
      } catch (pdfErr: any) {
        console.error("[ROUTE] PDF parse error:", pdfErr.message);
        // Keep fileBase64 intact — let the provider try to handle it as-is
      }
    }

    if (!encryptedKey && provider !== 'Custom') {
      return NextResponse.json({ error: "API Key is missing" }, { status: 401 });
    }

    const apiKey = encryptedKey ? decryptKey(encryptedKey) : "";
    if (!apiKey && provider !== 'Custom') {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    // ─── Task 1: System + User prompt split with few-shot examples ─────────────
    const systemPrompt = `You are a precise text annotator. Your ONLY job is to wrap every word in the text with its ${targetLanguage} translation using the format [[Word|Translation]].

STRICT RULES — follow ALL of them without exception:
1. EVERY single word MUST be wrapped in [[Word|Translation]] brackets.
2. Punctuation, spaces, and newlines MUST remain OUTSIDE the brackets.
3. NEVER insert translated words or any other text outside [[...]] brackets.
4. Keep the ORIGINAL word exactly as-is (do not change capitalization or spelling).
5. Use CONTEXTUAL translations — translate the word as it is used in this specific sentence.
6. DO NOT return JSON, markdown code blocks, explanations, or any extra text.
7. DO NOT skip any words. DO NOT merge multiple words into one bracket.
8. Preserve paragraph structure using double newlines between paragraphs.

CORRECT EXAMPLES:
Input: "The cat sat on the mat."
Output: [[The|Определённый артикль]] [[cat|кот]] [[sat|сидел]] [[on|на]] [[the|определённый артикль]] [[mat|коврик]].

Input: "She quickly ran away."
Output: [[She|Она]] [[quickly|быстро]] [[ran|убежала]] [[away|прочь]].

Input: "Hello, world!"
Output: [[Hello|Привет]], [[world|мир]]!

WRONG (do NOT do this):
- "[[The|Определённый артикль]] кот [[sat|сидел]]" — "кот" is outside brackets
- "[[The cat|Кот сидел]]" — multiple words merged into one bracket
- "\`\`\`[[Hello|Привет]]\`\`\`" — wrapped in code block
- "Here is the translation: [[Hello|Привет]]" — extra explanation text`;

    console.log(`[ROUTE] System prompt prepared (${systemPrompt.length} chars).`);

    // SPECIAL HANDLING FOR MINIMAX IMAGE RECOGNITION VIA MCP
    if (provider === "MiniMax" && fileBase64) {
      console.log("[ROUTE] Initializing MiniMax MCP for image recognition...");
      
      const rawBaseUrl = baseUrl || "https://api.minimax.io";
      // The MCP server hits /v1/coding_plan/vlm directly. If the user set the base URL to the Anthropic compatibility endpoint, it will cause a 404.
      const sanitizedHost = rawBaseUrl.replace(/\/anthropic\/?$/, "").replace(/\/v1\/?$/, "");

      const transport = new StdioClientTransport({
        command: process.platform === "win32" ? "uvx.exe" : "uvx",
        args: ["minimax-coding-plan-mcp"],
        env: {
          ...process.env,
          "MINIMAX_API_KEY": apiKey,
          "MINIMAX_API_HOST": sanitizedHost
        }
      });

      const client = new Client({
        name: "InteractiveDictionaryClient",
        version: "1.0.0"
      }, {
        capabilities: {}
      });

      try {
        await client.connect(transport);
        console.log("[ROUTE] MCP Client connected. Calling understand_image...");

        // Save base64 to a temporary file to avoid large stdio payloads
        const os = require("os");
        const path = require("path");
        const fs = require("fs");
        
        // Extract base64 data and extension
        const matches = fileBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        let imageSource = fileBase64;
        let tempFilePath = "";

        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const ext = mimeType.split("/")[1] || "png";
          
          if (!["jpeg", "jpg", "png", "webp"].includes(ext.toLowerCase())) {
            throw new Error(`Unsupported file type for MiniMax Vision: ${mimeType}`);
          }

          tempFilePath = path.join(os.tmpdir(), `minimax_upload_${Date.now()}.${ext}`);
          fs.writeFileSync(tempFilePath, Buffer.from(base64Data, "base64"));
          imageSource = tempFilePath;
          console.log(`[ROUTE] Saved temp image to ${tempFilePath}`);
        }

        // For MiniMax MCP, combine system + user prompt
        const fullMcpPrompt = `${systemPrompt}\n\nNow annotate the following text:\n${text || ""}`;
        console.log(`[ROUTE] Sending MCP prompt (${fullMcpPrompt.length} chars) to MiniMax...`);

        const result = await client.callTool({
          name: "understand_image",
          arguments: {
            image_source: imageSource,
            prompt: fullMcpPrompt
          }
        });

        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        const textResult = (result.content as any[]).find((c: any) => c.type === 'text')?.text || "";
        console.log(`[ROUTE] MCP understand_image completed. Raw response length: ${textResult.length} chars.`);

        // Clean up markdown wrapping if any
        const cleanContent = textResult.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
        return NextResponse.json({ annotated_text: cleanContent });
      } catch (mcpError: any) {
        console.error("[ROUTE] MCP Error:", mcpError);
        let errorMsg = mcpError.message || "Failed to process image via MCP.";
        if (errorMsg.includes("ENOENT") && errorMsg.includes("uvx")) {
           errorMsg = "uvx command not found. Please install Astral's 'uv' (pip install uv) to run the MiniMax MCP.";
        }
        return NextResponse.json({ error: `MiniMax MCP Error: ${errorMsg}` }, { status: 500 });
      } finally {
        try {
          await client.close();
        } catch (e) {}
      }
    }

    // ─── Handle large text: chunk it and process each chunk ──────────────────
    const chunks = text ? chunkText(text) : [""];
    const annotatedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[ROUTE] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);

      // User message: just the text to annotate
      const userContent: any[] = [];

      if (chunk) {
        userContent.push({ type: "text", text: `TEXT TO ANNOTATE:\n${chunk}` });
      }

      if (fileBase64 && i === 0) {
        // Only attach image on first chunk
        userContent.push({
          type: "image_url",
          image_url: { url: fileBase64 }
        });
      }

      let url = "";
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      let body: any = {};

      // Helper to ensure URL ends correctly
      const buildUrl = (base: string, defaultBase: string, endpoint: string) => {
        const b = (base && base.trim()) || defaultBase;
        return b.endsWith('/') ? `${b}${endpoint}` : `${b}/${endpoint}`;
      };

      switch (provider) {
        case "OpenRouter":
          url = buildUrl(baseUrl, "https://openrouter.ai/api/v1", "chat/completions");
          headers["Authorization"] = `Bearer ${apiKey}`;
          headers["HTTP-Referer"] = "https://interactive-dictionary.vercel.app";
          headers["X-Title"] = "Interactive Dictionary";
          body = {
            model: modelName || "google/gemini-3.1-flash-lite-preview",
            temperature: 0,
            max_tokens: 8192,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ]
          };
          break;
        case "OpenAI":
          url = buildUrl(baseUrl, "https://api.openai.com/v1", "chat/completions");
          headers["Authorization"] = `Bearer ${apiKey}`;
          body = {
            model: modelName || "gpt-4o",
            temperature: 0,
            max_tokens: 8192,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ]
          };
          break;
        case "Anthropic":
          url = buildUrl(baseUrl, "https://api.anthropic.com/v1", "messages");
          headers["x-api-key"] = apiKey;
          headers["anthropic-version"] = "2023-06-01";
          const anthropicContent = userContent.map(part => {
            if (part.type === 'text') return part;
            if (part.type === 'image_url') {
              const imageData = part.image_url.url;
              const match = imageData.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
              if (match) {
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: match[1],
                    data: match[2]
                  }
                };
              }
            }
            return part;
          });
          body = {
            model: modelName || "claude-3-5-sonnet-20240620",
            system: systemPrompt,   // Anthropic uses top-level system param
            temperature: 0,
            max_tokens: 8192,
            messages: [{ role: "user", content: anthropicContent }]
          };
          break;
        case "MiniMax":
          url = buildUrl(baseUrl, "https://api.minimax.io/v1", "text/chatcompletion_v2");
          headers["Authorization"] = `Bearer ${apiKey}`;
          body = {
            model: modelName || "MiniMax-M2.7",
            temperature: 0,
            max_tokens: 8192,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ]
          };
          break;
        case "Custom":
          url = baseUrl || "";
          headers["Authorization"] = `Bearer ${apiKey}`;
          body = {
            model: modelName || "openai/gpt-5",
            temperature: 0,
            max_tokens: 8192,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ]
          };
          break;
        default:
          throw new Error("Unsupported provider");
      }

      console.log(`[ROUTE] Routing to ${provider} at ${url} using model ${body.model}`);
      console.log(`[ROUTE] Request body (preview): temperature=${body.temperature}, max_tokens=${body.max_tokens}, messages count=${body.messages?.length}`);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        console.error(`[ROUTE] ${provider} API Error:`, data.error);
        return NextResponse.json({ error: data.error.message || `${provider} Error` }, { status: 500 });
      }

      let aiContent = "";
      if (provider === "Anthropic") {
        if (!data.content || data.content.length === 0) {
          throw new Error("No response from Anthropic");
        }
        aiContent = data.content[0].text;
        console.log(`[ROUTE] Anthropic response: ${aiContent.length} chars, usage: ${JSON.stringify(data.usage)}`);
      } else {
        if (!data.choices || data.choices.length === 0) {
          throw new Error(`No response from ${provider}`);
        }
        aiContent = data.choices[0].message.content;
        console.log(`[ROUTE] ${provider} response: ${aiContent.length} chars, usage: ${JSON.stringify(data.usage)}`);
      }

      console.log(`[ROUTE] Raw AI response (first 300 chars): ${aiContent.substring(0, 300)}`);
      
      // Clean up potential markdown wrapping
      const cleanChunk = aiContent.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
      annotatedChunks.push(cleanChunk);
    }

    const finalResult = annotatedChunks.join('\n\n');
    console.log(`[ROUTE] Final annotated text: ${finalResult.length} chars across ${annotatedChunks.length} chunk(s).`);

    return NextResponse.json({ annotated_text: finalResult });
  } catch (error: unknown) {
    console.error("[ROUTE] API Error:", error);
    return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
