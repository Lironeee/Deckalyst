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

// Create directories with proper permissions
[CACHE_DIR, UPLOAD_DIR, SLIDES_DIR].forEach((dir) => {
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o777 });
    }
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
});

// Mock data for market research
const MOCK_MARKET_DATA = {
  crunchbase: {
    funding_rounds: [
      { amount: 5000000, date: "2023-01", type: "Series A" },
      { amount: 1200000, date: "2022-03", type: "Seed" },
    ],
    competitors: [
      { name: "Competitor A", funding_total: 12000000 },
      { name: "Competitor B", funding_total: 8000000 },
    ],
    market_size: 4500000000,
    growth_rate: 23.5,
  },
  statista: {
    market_data: [
      { year: 2023, size: 4200000000 },
      { year: 2024, projected_size: 5100000000 },
    ],
    industry_metrics: {
      average_deal_size: 850000,
      customer_acquisition_cost: 12000,
      lifetime_value: 89000,
    },
  },
  news: [
    {
      title: "Industry Growth Trends",
      date: "2024-01-15",
      highlights: [
        "Market expected to reach $8B by 2026",
        "Key players raising significant funding",
      ],
    },
  ],
};

interface ResearchResult {
  source: string;
  date: string;
  data: any;
  confidence: "high" | "medium" | "low";
}

// Simulated research function
async function performOnlineResearch(
  query: string,
  sources: string[]
): Promise<ResearchResult[]> {
  const results: ResearchResult[] = [];

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  for (const source of sources) {
    let mockData;
    switch (source) {
      case "crunchbase":
        mockData = MOCK_MARKET_DATA.crunchbase;
        break;
      case "statista":
        mockData = MOCK_MARKET_DATA.statista;
        break;
      case "news":
        mockData = MOCK_MARKET_DATA.news;
        break;
      default:
        mockData = null;
    }

    results.push({
      source,
      date: new Date().toISOString(),
      data: mockData,
      confidence: mockData ? "high" : "low",
    });
  }

  return results;
}

// Mock Harmonic data
const MOCK_HARMONIC_DATA: HarmonicCompany = {
  name: "Example Corp",
  description: "Innovative SaaS Platform",
  founded_date: "2022-01-01",
  employee_count: 45,
  funding_total: 6200000,
  industry: "Enterprise Software",
  location: {
    country: "United States",
    city: "San Francisco",
  },
  social_media: {
    linkedin_url: "https://linkedin.com/company/example-corp",
  },
  employees: [
    {
      title: "CEO",
      department: "Executive",
      role_type: "Leadership",
      location: "San Francisco",
      start_date: "2022-01",
      contact: {
        linkedin_url: "https://linkedin.com/in/ceo",
      },
    },
    {
      title: "CTO",
      department: "Engineering",
      role_type: "Leadership",
      location: "San Francisco",
      start_date: "2022-02",
      contact: {
        linkedin_url: "https://linkedin.com/in/cto",
      },
    },
  ],
  employee_highlights: [
    {
      category: "Executive Experience",
      text: "Former VP at Major Tech Company",
    },
    {
      category: "Technical Background",
      text: "15+ years in enterprise software",
    },
  ],
};

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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

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

    // Check and create parent directory if necessary
    const cacheParentDir = join(CACHE_DIR, "..");
    if (!existsSync(cacheParentDir)) {
      mkdirSync(cacheParentDir, { recursive: true, mode: 0o777 });
    }

    // Write file with error handling
    try {
      writeFileSync(cachePath, JSON.stringify(analysis), { mode: 0o666 });
    } catch (writeError) {
      console.error("Cache write error:", writeError);
      // Continue without cache
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
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
  slidesDir: string,
  hash: string,
  website?: string
): Promise<string> {
  let harmonicData: HarmonicCompany | undefined = undefined;
  let harmonicSummary = "";
  let marketResearch = null;

  // Simulate fetching company data
  await new Promise((resolve) => setTimeout(resolve, 300));
  harmonicData = MOCK_HARMONIC_DATA;

  if (harmonicData) {
    // Get summary
    harmonicSummary = await summarizeHarmonicData(harmonicData);

    // Perform mock market research
    const industry = harmonicData.industry || "";
    const companyName = harmonicData.name || "";

    marketResearch = await performOnlineResearch(
      `${companyName} ${industry} market size revenue funding`,
      ["crunchbase", "statista", "news"]
    );

    console.log("📊 Market Research Results:", marketResearch.length);
  }

  // Process slides
  const slides = readdirSync(slidesDir)
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
    const batchContent = await processBatch(batch, slidesDir);
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
  const systemPrompt = `You are an experienced venture capital analyst with access to online data. Your task is to:
1. When information is missing or unclear, actively search for and incorporate relevant online data about:
   - Market size and growth rates from reliable sources (e.g., Gartner, IDC, Statista)
   - Competitor funding and valuations from Crunchbase, PitchBook, or similar
   - Industry benchmarks and metrics from public sources
2. ALWAYS cite your sources with format: [Source: Organization/Website, Date]
3. Focus heavily on quantitative data:
   - Market size in specific dollar amounts
   - Growth rates with exact percentages
   - Competitor revenue and funding amounts
   - Industry-standard metrics and benchmarks
4. Give significant weight to the verified Harmonic data about the team and company
5. Pay special attention to team size, composition, and experience with exact numbers
6. Consider the company's actual market presence based on verified data
7. Assign a SINGLE SCORE out of 100 reflecting the startup's overall potential
8. The team assessment (35pts) should heavily consider the verified employee data
9. Other scoring components: market (25pts), product (20pts), traction/metrics (20pts)
10. If any critical information is missing, explicitly state what data would be needed for a more complete analysis

IMPORTANT: 
- Every market size, growth rate, or benchmark claim must be supported by a cited source
- When using Harmonic data, cite it as [Source: Harmonic.ai, Current Date]
- If online data contradicts the pitch deck, highlight the discrepancy
- Focus on hard numbers over qualitative assessments
- For each section, include a "Data Confidence Score" (High/Medium/Low) based on available verified data

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
Data Confidence: [High/Medium/Low]

📊 MARKET ANALYSIS
• Total Addressable Market (TAM):
  - Current market size with source
  - Growth rate (CAGR) with source
  - Geographic breakdown if available
• Serviceable Addressable Market (SAM):
  - Size with source
  - Key market segments
• Serviceable Obtainable Market (SOM):
  - Realistic market capture projection
  - Basis for calculation
Data Confidence: [High/Medium/Low]

💰 BUSINESS METRICS
• Current Revenue:
  - ARR/MRR if SaaS
  - Revenue growth rate
  - Unit economics (CAC, LTV, Payback Period)
• Industry Benchmarks:
  - Comparison to industry standards
  - Source of benchmarks
• Funding History:
  - Previous rounds with amounts
  - Valuation history if available
Data Confidence: [High/Medium/Low]

👥 TEAM ANALYSIS
• Company Size & Structure:
  - Total employee count with source
  - Department distribution (%)
  - YoY growth rate
• Leadership Metrics:
  - Executive team size
  - Years of relevant experience
  - Prior exits or notable achievements
• Key Performance Indicators:
  - Employee retention rate
  - Key hires in last 12 months
  - Technical talent ratio
Data Confidence: [High/Medium/Low]

🏢 COMPETITIVE LANDSCAPE
• Market Share Analysis:
  - Top competitors with revenue data
  - Market share percentages
  - Growth rates comparison
• Competitor Metrics:
  - Funding amounts and dates
  - Team size comparison
  - Product pricing comparison
Data Confidence: [High/Medium/Low]

📈 TRACTION & GROWTH
• Customer Metrics:
  - Current customer count
  - Customer acquisition rate
  - Churn rate vs industry standard
• Growth Metrics:
  - MoM/YoY growth rates
  - Expansion revenue
  - Sales efficiency metrics
Data Confidence: [High/Medium/Low]

🎯 FINAL ASSESSMENT
Investment Score: [X/100]
• Detailed Scoring Breakdown:
  - Team (35pts): [Score] - [Justification with metrics]
  - Market (25pts): [Score] - [Justification with metrics]
  - Product (20pts): [Score] - [Justification with metrics]
  - Traction (20pts): [Score] - [Justification with metrics]

📝 Data Gaps & Risks:
• List of missing critical data points
• Identified inconsistencies between sources
• Key risk factors with quantitative impact

[All claims must be supported by cited sources]`,
          },
          { type: "text", text: content },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.4,
  });

  return response.choices[0].message.content || "No analysis generated";
}
