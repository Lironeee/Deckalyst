import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that can answer questions about a pitch deck. You have analyzed this company's pitch deck and have access to verified Harmonic data. Always cite your sources by indicating whether information comes from:\n- [Pitch Deck]\n- [Harmonic Data]\n- [Market Analysis]\n\nProvide clear, concise answers and always back up your statements with the source of information.",
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({
      message: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Erreur lors du traitement du message:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement du message" },
      { status: 500 }
    );
  }
}
