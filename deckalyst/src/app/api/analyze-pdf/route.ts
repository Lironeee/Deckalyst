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

// Ajout de l'interface pour Harmonic
interface HarmonicCompany {
  name?: string;
  description?: string;
  founded_date?: string;
  employee_count?: number;
  funding_total?: number;
  website_domain?: string;
  industry?: string;
  location?: {
    country?: string;
    city?: string;
  };
  social_media?: {
    linkedin_url?: string;
  };
  employees?: Array<{
    title: string;
    department: string;
    role_type: string;
    location?: string;
    description?: string;
    start_date?: string;
    contact?: {
      linkedin_url?: string;
    };
  }>;
  employee_highlights?: Array<{
    category: string;
    text: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const website = formData.get("website") as string;
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
    const analysis = await analyzePitchDeck(slidesDir, hash, website);

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

async function summarizeHarmonicData(
  harmonicData: HarmonicCompany
): Promise<string> {
  const essentialData = {
    company: {
      name: harmonicData.name,
      description: harmonicData.description,
      founded_date: harmonicData.founded_date,
      employee_count: harmonicData.employee_count,
      location: harmonicData.location,
      funding_total: harmonicData.funding_total,
      company_linkedin: harmonicData.social_media?.linkedin_url,
    },
    // Enrichir les données des employés
    employees: harmonicData.employees?.slice(0, 10)?.map((emp) => ({
      title: emp.title,
      department: emp.department,
      role_type: emp.role_type,
      location: emp.location,
      linkedin_url: emp.contact?.linkedin_url,
      start_date: emp.start_date,
      description: emp.description,
    })),
    // Filtrer les highlights pertinents
    highlights: harmonicData.employee_highlights
      ?.filter(
        (h) =>
          h.category.includes("Executive") ||
          h.category.includes("Founder") ||
          h.category.includes("Technical") ||
          h.category.includes("Prior") ||
          h.category.includes("Experience")
      )
      ?.slice(0, 15),
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are an expert at analyzing company data. Your main focus should be on team composition, employee count, and professional backgrounds. Be very specific about employee numbers, departments distribution, and leadership experience.",
      },
      {
        role: "user",
        content: `Analyze this verified company data and provide a detailed summary focusing on:
1. Company Size & Structure:
   - Total employee count and growth
   - Department distribution
   - Office locations

2. Leadership & Key People:
   - Executive team composition
   - Notable backgrounds and achievements
   - LinkedIn profiles when available

3. Team Experience:
   - Prior companies and roles
   - Technical expertise
   - Industry experience

4. Company Overview:
   - Funding and metrics
   - Market presence
   - Notable achievements

Please be very specific with numbers and include all relevant LinkedIn URLs.

Raw data:
${JSON.stringify(essentialData, null, 2)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  return response.choices[0].message.content || "";
}

async function analyzePitchDeck(
  slidesFolder: string,
  hash: string,
  website?: string
): Promise<string> {
  let harmonicData = null;
  let harmonicSummary = "";

  if (website) {
    try {
      const domain = website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      console.log("🔍 Fetching Harmonic data for domain:", domain);

      const harmonicApiUrl = `https://api.harmonic.ai/companies?website_domain=${domain}&apikey=${process.env.HARMONIC_API_KEY}`;

      const harmonicResponse = await fetch(harmonicApiUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ website_domain: domain }),
      });

      const responseText = await harmonicResponse.text();

      try {
        const data = JSON.parse(responseText);
        harmonicData = data;

        if (harmonicData) {
          console.log(
            "👥 Employees found:",
            harmonicData.employees?.length || 0
          );
          console.log(
            "🔗 LinkedIn URLs found:",
            harmonicData.employees?.filter(
              (emp: any) => emp.contact?.linkedin_url
            ).length || 0
          );
          console.log(
            "🏢 Company LinkedIn:",
            harmonicData.social_media?.linkedin_url || "Not found"
          );

          // Sauvegarder les données brutes
          const harmonicCachePath = join(CACHE_DIR, `${hash}_harmonic.json`);
          writeFileSync(
            harmonicCachePath,
            JSON.stringify(harmonicData, null, 2)
          );

          // Obtenir le résumé
          harmonicSummary = await summarizeHarmonicData(harmonicData);
          console.log("✨ Harmonic Summary:");
          console.log(harmonicSummary);
        }
      } catch (parseError) {
        console.error("❌ Error parsing Harmonic response:", parseError);
      }
    } catch (error) {
      console.error("Erreur Harmonic:", error);
    }
  }

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
  return await getFinalAnalysis(allContent, harmonicData, harmonicSummary);
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

async function getFinalAnalysis(
  content: string,
  harmonicData?: HarmonicCompany,
  harmonicSummary?: string
): Promise<string> {
  const systemPrompt = `You are an experienced venture capital analyst. Your task is to:
1. Thoroughly analyze the pitch deck
2. Give significant weight to the verified Harmonic data about the team and company
3. Pay special attention to team size, composition, and experience
4. Consider the company's actual market presence based on verified data
5. Assign a SINGLE SCORE out of 100 reflecting the startup's overall potential
6. The team assessment (35pts) should heavily consider the verified employee data
7. Other scoring components: market (25pts), product (20pts), traction/metrics (20pts)

IMPORTANT: In the TEAM section, copy and paste the exact leadership information from the Harmonic data summary, 
keeping all the detailed executive backgrounds and dates. This verified data is crucial and should be presented 
in its complete form. Only add additional team analysis after this verified data section.

When analyzing other sections, if there are discrepancies between the pitch deck and verified data, mention them.

${
  harmonicSummary
    ? `
Verified company data from Harmonic:
${harmonicSummary}

Use this verified data as the primary source for team analysis and company metrics.
Ensure to keep the exact format and details of the leadership section in your final analysis.
`
    : ""
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt,
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
• Company Size & Structure:
  - Total employee count and growth
  - Department distribution
  - Office locations

• Leadership & Key People:
  - Executive team composition
  - Notable backgrounds and achievements
  - LinkedIn profiles when available

• Team Experience & Expertise:
  - Prior companies and roles
  - Technical expertise levels
  - Industry experience
  - Key hires and departures

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
