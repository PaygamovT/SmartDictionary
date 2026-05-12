import { NextRequest, NextResponse } from "next/server";
import { decryptKey } from "@/utils/crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

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

    // If the user uploaded a text file, decode it and append to the text prompt instead of treating it as an image
    if (fileBase64 && fileBase64.startsWith("data:text/")) {
      const matches = fileBase64.match(/^data:text\/[a-zA-Z0-9-.+]+;base64,(.+)$/);
      if (matches) {
        const decodedText = Buffer.from(matches[1], "base64").toString("utf-8");
        text = text ? `${text}\n\n${decodedText}` : decodedText;
        fileBase64 = ""; // Clear fileBase64 so it isn't processed as an image
        console.log("[FIX] Decoded text file upload into text prompt.");
      }
    }

    // If the user uploaded a PDF, extract text with pdf-parse and treat as text
    if (fileBase64 && fileBase64.startsWith("data:application/pdf")) {
      console.log("[FIX] PDF detected — extracting text with pdf-parse...");
      try {
        const pdfParse = require("pdf-parse");
        const pdfMatch = fileBase64.match(/^data:application\/pdf;base64,(.+)$/);
        if (pdfMatch) {
          const pdfBuffer = Buffer.from(pdfMatch[1], "base64");
          const pdfData = await pdfParse(pdfBuffer);
          const extractedText = pdfData.text?.trim();
          if (extractedText) {
            text = text ? `${text}\n\n${extractedText}` : extractedText;
            fileBase64 = ""; // Clear fileBase64 so it isn't processed as an image
            console.log(`[FIX] Extracted ${extractedText.length} chars from PDF.`);
          } else {
            // PDF has no extractable text (scanned image PDF) — keep fileBase64 for vision processing
            console.log("[FIX] PDF has no extractable text — will attempt vision processing.");
          }
        }
      } catch (pdfErr: any) {
        console.error("[FIX] PDF parse error:", pdfErr.message);
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

    const prompt = `You are a text extractor and contextual translator.
Task:
1. Extract the original text from the provided material. Clean up any OCR artifacts like '<br>' or strange characters, but maintain paragraph structure using double newlines.
2. Annotate every single word in the text with its contextual ${targetLanguage} translation.
3. Use the exact format: [[Word|Translation]]
   - Punctuation and spaces MUST remain OUTSIDE the brackets.
   - Example: Hello, world! -> [[Hello|Привет]], [[world|мир]]!
   - Ensure you translate the word in its specific context.
4. Return ONLY the annotated text. DO NOT return JSON. DO NOT use markdown code blocks.`;

    // SPECIAL HANDLING FOR MINIMAX IMAGE RECOGNITION VIA MCP
    if (provider === "MiniMax" && fileBase64) {
      console.log("[FIX] Initializing MiniMax MCP for image recognition...");
      
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
        console.log("[FIX] MCP Client connected. Calling understand_image...");

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
          console.log(`[FIX] Saved temp image to ${tempFilePath}`);
        }

        const result = await client.callTool({
          name: "understand_image",
          arguments: {
            image_source: imageSource,
            prompt: prompt
          }
        });

        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        const textResult = (result.content as any[]).find((c: any) => c.type === 'text')?.text || "";
        console.log("[FIX] MCP understand_image completed successfully.");

        // Clean up markdown wrapping if any
        const cleanContent = textResult.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
        return NextResponse.json({ annotated_text: cleanContent });
      } catch (mcpError: any) {
        console.error("[FIX] MCP Error:", mcpError);
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

    const contentParts: any[] = [
      { type: "text", text: prompt }
    ];

    if (text) {
      contentParts.push({ type: "text", text: `TEXT TO PROCESS:\n${text}` });
    }

    if (fileBase64) {
      contentParts.push({
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
          messages: [{ role: "user", content: contentParts }]
        };
        break;
      case "OpenAI":
        url = buildUrl(baseUrl, "https://api.openai.com/v1", "chat/completions");
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
          model: modelName || "gpt-4o",
          messages: [{ role: "user", content: contentParts }]
        };
        break;
      case "Anthropic":
        url = buildUrl(baseUrl, "https://api.anthropic.com/v1", "messages");
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        const anthropicContent = contentParts.map(part => {
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
          max_tokens: 4096,
          messages: [{ role: "user", content: anthropicContent }]
        };
        break;
      case "MiniMax":
        url = buildUrl(baseUrl, "https://api.minimax.io/v1", "text/chatcompletion_v2");
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
          model: modelName || "MiniMax-M2.7",
          messages: [{ role: "user", content: contentParts }]
        };
        break;
      case "Custom":
        url = baseUrl || "";
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
          model: modelName || "openai/gpt-5",
          messages: [{ role: "user", content: contentParts }]
        };
        break;
      default:
        throw new Error("Unsupported provider");
    }

    console.log(`[FIX] Routing to ${provider} at ${url} using model ${body.model}`);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      console.error(`${provider} API Error:`, data.error);
      return NextResponse.json({ error: data.error.message || `${provider} Error` }, { status: 500 });
    }

    let aiContent = "";
    if (provider === "Anthropic") {
      if (!data.content || data.content.length === 0) {
        throw new Error("No response from Anthropic");
      }
      aiContent = data.content[0].text;
    } else {
      if (!data.choices || data.choices.length === 0) {
        throw new Error(`No response from ${provider}`);
      }
      aiContent = data.choices[0].message.content;
    }
    
    // Clean up potential markdown wrapping
    const cleanContent = aiContent.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();

    return NextResponse.json({ annotated_text: cleanContent });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
