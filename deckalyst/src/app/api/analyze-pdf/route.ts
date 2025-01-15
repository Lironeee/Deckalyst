import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import {
  writeFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  existsSync,
} from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { createHash } from "crypto";

const execAsync = promisify(exec);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache directory
const CACHE_DIR = join(process.cwd(), "cache");
const UPLOAD_DIR = join(process.cwd(), "tmp", "uploads");
const SLIDES_DIR = join(process.cwd(), "tmp", "slides");

// Créer les dossiers avec les bonnes permissions
[CACHE_DIR, UPLOAD_DIR, SLIDES_DIR].forEach((dir) => {
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o777 }); // Ajouter les permissions
    }
  } catch (error) {
    console.error(`Erreur lors de la création du dossier ${dir}:`, error);
  }
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );

    // Generate file hash for caching
    const bytes = await file.arrayBuffer();
    const hash = createHash("md5").update(Buffer.from(bytes)).digest("hex");
    const cachePath = join(CACHE_DIR, `${hash}.json`);

    // Check cache first
    if (existsSync(cachePath)) {
      const cachedAnalysis = JSON.parse(readFileSync(cachePath, "utf-8"));
      return NextResponse.json({ success: true, analysis: cachedAnalysis });
    }

    // Process new analysis
    const uploadDir = join(process.cwd(), "tmp", "uploads");
    const slidesDir = join(process.cwd(), "tmp", "slides");
    mkdirSync(uploadDir, { recursive: true });
    mkdirSync(slidesDir, { recursive: true });

    // Save and process PDF
    const pdfPath = join(uploadDir, `${hash}.pdf`);
    writeFileSync(pdfPath, Buffer.from(bytes));

    // Optimize image extraction
    await extractSlidesFromPdf(pdfPath, slidesDir, hash);
    const analysis = await analyzePitchDeck(slidesDir, hash);

    // Vérifier et créer le dossier parent si nécessaire
    const cacheParentDir = join(CACHE_DIR, "..");
    if (!existsSync(cacheParentDir)) {
      mkdirSync(cacheParentDir, { recursive: true, mode: 0o777 });
    }

    // Écrire le fichier avec gestion d'erreur
    try {
      writeFileSync(cachePath, JSON.stringify(analysis), { mode: 0o666 });
    } catch (writeError) {
      console.error("Erreur d'écriture du cache:", writeError);
      // Continuer sans le cache
    }

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
  outputFolder: string,
  hash: string
): Promise<void> {
  const command = `pdftoppm -png -r 150 "${pdfPath}" "${outputFolder}/${hash}"`;
  await execAsync(command);
}

async function analyzePitchDeck(
  slidesFolder: string,
  hash: string
): Promise<string> {
  // Batch process images
  const slides = readdirSync(slidesFolder)
    .filter((file) => file.startsWith(hash) && file.endsWith(".png"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

  // Process images in smaller batches
  const BATCH_SIZE = 4;
  const batches = [];
  for (let i = 0; i < slides.length; i += BATCH_SIZE) {
    const batch = slides.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  let allContent = "";
  for (const batch of batches) {
    const batchContent = await processBatch(batch, slidesFolder);
    allContent += batchContent;
  }

  // Final analysis with accumulated content
  return await getFinalAnalysis(allContent);
}

async function processBatch(
  slides: string[],
  slidesFolder: string
): Promise<string> {
  const imageContents = slides.map((slide) => {
    const imageBuffer = readFileSync(join(slidesFolder, slide));
    return {
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${imageBuffer.toString("base64")}`,
        detail: "low",
      },
    };
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: imageContents as any[],
      },
    ],
    max_tokens: 4096,
    temperature: 0.4,
  });

  return response.choices[0].message.content || "";
}

async function getFinalAnalysis(content: string): Promise<string> {
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
        content: [
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
          { type: "text", text: content },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.4,
  });

  return response.choices[0].message.content || "Aucune analyse générée";
}
