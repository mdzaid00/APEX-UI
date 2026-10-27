import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API key is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt || prompt.length > 4000) {
      return NextResponse.json(
        { error: "Please provide a prompt of up to 4000 characters." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", response.status);
      return NextResponse.json(
        { error: "The AI provider could not complete the request. Check API access and quota." },
        { status: 502 }
      );
    }

    const answer = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("\n")
      .trim();

    if (!answer) {
      return NextResponse.json(
        { error: "The AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json(
      { error: "Invalid request or unexpected server error." },
      { status: 500 }
    );
  }
}
