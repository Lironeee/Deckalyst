import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Créer les dossiers temporaires
    const uploadDir = join(process.cwd(), "tmp", "uploads");
    const slidesDir = join(process.cwd(), "tmp", "slides");
    mkdirSync(uploadDir, { recursive: true });
    mkdirSync(slidesDir, { recursive: true });

    // Sauvegarder le PDF
    const pdfPath = join(uploadDir, "presentation.pdf");
    const bytes = await file.arrayBuffer();
    writeFileSync(pdfPath, Buffer.from(bytes));

    // Convertir le PDF en images
    await extractSlidesFromPdf(pdfPath, slidesDir);

    // Analyser les slides
    const analysis = await analyzePitchDeck(slidesDir);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement" },
      { status: 500 }
    );
  }
}

async function extractSlidesFromPdf(
  pdfPath: string,
  outputFolder: string
): Promise<number> {
  mkdirSync(outputFolder, { recursive: true });

  try {
    const command = `pdftoppm -png -r 300 "${pdfPath}" "${outputFolder}/slide"`;
    await execAsync(command);
    console.log(`Slides extraites dans le dossier : ${outputFolder}`);
    return -1;
  } catch (error) {
    console.error("Erreur lors de la conversion:", error);
    throw error;
  }
}

async function analyzePitchDeck(slidesFolder: string): Promise<string> {
  const slides = readdirSync(slidesFolder)
    .filter((file) => file.endsWith(".png"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

  const content: any[] = [
    {
      type: "text",
      text: `Analyze this pitch deck and provide a detailed analysis following this structure:

🎯 STARTUP IDENTITY
• Company Name: [Required - write "Unknown" if not found]
• Founded Date: [Required - write "Unknown" if not found]
• Location: [Required - write "Unknown" if not found]
• One-Line Description: [Required - write "Unknown" if not found]

👥 TEAM
• Founders Background:
  - Education and previous experience
  - Previous founder/C-level positions
  - Notable achievements

• Team Structure:
  - Current team size and composition
  - Key hires/departures (last 6 months)
  - Department breakdown (Sales, Tech, etc.)
  - Tech team details (PhDs, Engineers, Data Scientists)

💰 BUSINESS & METRICS
• Business Model:
  - Type (SaaS, Marketplace, Hardware)
  - Revenue streams
  - Pricing strategy

• Key Metrics:
  - ARR/Revenue (with product/function split)
  - Growth rates (YoY, MoM)
  - Unit economics (CAC, LTV, etc.)

🚀 PRODUCT
• Product Overview:
  - Core capabilities & features
  - Technical architecture
  - Product roadmap

• Market Validation:
  - Customer testimonials
  - External ratings (G2, Product Hunt, Gartner)
  - Business cases

🌍 MARKET & COMPETITION
• Market Analysis:
  - Market sizing (TAM, SAM, SOM)
  - Market structure
  - Go-to-market strategy

• Competitive Landscape:
  - Direct competitors
  - Incumbent players
  - Competitive advantages

🎯 FINAL ASSESSMENT
Investment Score: [X/100]

Justify the score based on:
• Team strength and experience
• Market opportunity and timing
• Product differentiation
• Business model sustainability
• Growth potential
• Risk factors

[Provide a clear explanation of the score, highlighting key strengths and concerns]`,
    },
  ];

  for (const slide of slides) {
    const imageBuffer = readFileSync(join(slidesFolder, slide));
    const base64Image = imageBuffer.toString("base64");
    content.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${base64Image}`,
        detail: "high",
      },
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an experienced venture capital analyst. Your task is to:\n" +
            "1. Thoroughly analyze the pitch deck\n" +
            "2. Provide a comprehensive analysis of each section\n" +
            "3. Assign a SINGLE SCORE out of 100 reflecting the startup's overall potential\n" +
            "4. The score should consider: team (25pts), market (25pts), product (25pts), traction/metrics (25pts)\n" +
            "5. Clearly justify your score with specific observations\n\n" +
            "Be direct and honest in your assessment. If information is missing, mention it as a risk factor.",
        },
        {
          role: "user",
          content: content,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Aucune analyse générée";
  } catch (error) {
    console.error("Erreur lors de l'analyse:", error);
    throw error;
  }
}
