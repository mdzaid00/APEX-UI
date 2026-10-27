import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const voiceId =
      typeof body.voiceId === "string" && /^[a-zA-Z0-9_-]+$/.test(body.voiceId)
        ? body.voiceId
        : process.env.ELEVENLABS_VOICE_ID;

    if (!text || text.length > 4000) {
      return NextResponse.json(
        { error: "Text must contain 1–4000 characters." },
        { status: 400 }
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { error: "Set ELEVENLABS_VOICE_ID in Vercel Environment Variables." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("ElevenLabs request failed:", response.status);
      return NextResponse.json(
        { error: "ElevenLabs could not generate speech. Check your voice ID, API access, and quota." },
        { status: 502 }
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request or unexpected server error." },
      { status: 500 }
    );
  }
}
