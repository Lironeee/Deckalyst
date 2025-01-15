import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {

  console.log('ok')

  try {
    const formData = await request.formData();
    const fileData = formData.get('fileData');
    const harmonicData = formData.get("harmonicData") as string;
    const analysis = await analyzePitchDeck(harmonicData,fileData);
    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement" },
      { status: 500 }
    );
  }
}
 
async function analyzePitchDeck(harmonicData: string, fileData:string): Promise<string> {


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

Utilisez ce format exact avec les lignes de séparation et les espaces. Remplissez chaque section en respectant les retours à la ligne et l'espacement.
Voici ce que je sais sur l'entreprise: ` + harmonicData   + ` and ` + fileData + `  ` ,
    },
  ];


  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
