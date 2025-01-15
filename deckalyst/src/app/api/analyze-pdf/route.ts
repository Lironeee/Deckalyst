import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { OpenAI } from "openai";

const execAsync = promisify(exec);

// Fonction pour extraire les slides du PDF
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

// Fonction pour analyser le pitch deck
async function analyzePitchDeck(slidesFolder: string): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

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
      text:
        "Voici un pitch deck complet. Analysez-le en détail et donnez votre avis d'investisseur sur l'ensemble du projet. Considérez :\n" +
        "- Le problème et la solution proposée\n" +
        "- Le marché potentiel et la traction\n" +
        "- L'avantage compétitif\n" +
        "- Le modèle économique\n" +
        "- L'équipe\n" +
        "Donnez une analyse détaillée et votre recommandation d'investissement.",
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
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Vous êtes un partenaire expérimenté d'un fonds de capital-risque. Analysez ce pitch deck complet et donnez votre avis détaillé sur l'opportunité d'investissement. Répondez en français.",
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
