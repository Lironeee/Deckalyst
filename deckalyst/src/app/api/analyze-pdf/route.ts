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
      text: `Analysez ce pitch deck en détail et structurez votre réponse avec beaucoup d'espacement :

🎯 ANALYSE DU PITCH DECK

-----------------

📊 PROBLÈME ET SOLUTION

• Problème identifié :

• Solution proposée :

• Points forts :


💹 MARCHÉ ET TRACTION

• Taille du marché :

• Croissance :

• Traction actuelle :

• Clients/Partenaires clés :


💪 AVANTAGES COMPÉTITIFS

• Différenciateurs clés :

• Barrières à l'entrée :
• Technologies propriétaires :


💰 MODÈLE ÉCONOMIQUE

• Type de revenus :

• Pricing :

• Metrics clés :

• Unit economics :


👥 ÉQUIPE

• Fondateurs :

• Expérience :

• Advisors :


💭 RECOMMANDATION D'INVESTISSEMENT

• Points forts :

• Points de vigilance :

• Potentiel de croissance :


🎯 CONCLUSION FINALE

Utilisez ce format exact avec les lignes de séparation et les espaces. Remplissez chaque section en respectant les retours à la ligne et l'espacement.`,
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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Vous êtes un partenaire expérimenté d'un fonds de capital-risque. Analysez ce pitch deck et structurez votre réponse en respectant scrupuleusement le formatage demandé avec les lignes de séparation et les espaces. Chaque section doit être clairement séparée des autres. Privilégiez les phrases courtes et impactantes. Répondez en français.",
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
