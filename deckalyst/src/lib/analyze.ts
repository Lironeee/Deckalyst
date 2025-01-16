import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzePitchDeck(
  harmonicData: string,
  fileData: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an experienced venture capital analyst. Analyze this data and provide insights.",
        },
        {
          role: "user",
          content: `Analyze this data:\nHarmonic Data: ${harmonicData}\nPitch Deck Data: ${fileData}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.4,
    });

    return response.choices[0].message.content || "No analysis generated";
  } catch (error) {
    console.error("Analysis error:", error);
    return "Error during analysis";
  }
}
