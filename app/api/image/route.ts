import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, size = "1024x1024", n = 1 } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: n,
      size: size,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (e: any) {
    console.error("Error generating image:", e);
    return NextResponse.json(
      { error: e.message || "Error generating image" },
      { status: e.status || 500 }
    );
  }
} 