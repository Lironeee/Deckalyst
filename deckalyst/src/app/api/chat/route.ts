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
            "Vous êtes un expert en analyse de pitch decks et en capital-risque. Vous avez analysé le pitch deck de cette entreprise et vous pouvez répondre à toutes les questions concernant ce projet. Répondez de manière concise et précise en français.",
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
