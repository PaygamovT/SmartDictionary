import { NextRequest, NextResponse } from "next/server";
import { decryptKey } from "@/utils/crypto";

export async function POST(req: NextRequest) {
  try {
    const { fileBase64, text, encryptedKey } = await req.json();

    if (!encryptedKey) {
      return NextResponse.json({ error: "API Key is missing" }, { status: 401 });
    }

    const apiKey = decryptKey(encryptedKey);
    if (!apiKey) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    const prompt = `You are a text extractor and contextual translator.
Task:
1. Extract the original text from the provided material. Clean up any OCR artifacts like '<br>' or strange characters, but maintain paragraph structure using double newlines.
2. Annotate every single word in the text with its contextual Russian translation.
3. Use the exact format: [[Word|Translation]]
   - Punctuation and spaces MUST remain OUTSIDE the brackets.
   - Example: Hello, world! -> [[Hello|Привет]], [[world|мир]]!
   - Ensure you translate the word in its specific context.
4. Return ONLY the annotated text. DO NOT return JSON. DO NOT use markdown code blocks.`;

    const contentParts: Record<string, unknown>[] = [
      { type: "text", text: prompt }
    ];

    if (text) {
      contentParts.push({ type: "text", text: `TEXT TO PROCESS:\n${text}` });
    }

    if (fileBase64) {
      // OpenRouter expects data URIs for images
      contentParts.push({
        type: "image_url",
        image_url: { url: fileBase64 }
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://interactive-dictionary.vercel.app",
        "X-Title": "Interactive Dictionary",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [
          {
            role: "user",
            content: contentParts
          }
        ]
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenRouter API Error:", data.error);
      return NextResponse.json({ error: data.error.message || "OpenRouter Error" }, { status: 500 });
    }

    if (!data.choices || data.choices.length === 0) {
      console.error("OpenRouter Error: No choices returned", data);
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const aiContent = data.choices[0].message.content;
    console.log("AI Response:", aiContent);
    
    // Clean up potential markdown wrapping
    const cleanContent = aiContent.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();

    return NextResponse.json({ annotated_text: cleanContent });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
