import { NextResponse } from "next/server";

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
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const website = formData.get("website") as string;
    const apiKey = formData.get("apikey") as string;

    if (!website) {
      return NextResponse.json(
        { error: "Site web non fourni" },
        { status: 400 }
      );
    }

    const url = `https://api.harmonic.ai/companies?website_domain=${website}&apikey=${apiKey}`;
    const harmonicResponse = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json"
      }
    });

    if (!harmonicResponse.ok) {
      return NextResponse.json(
        { error: "Échec de la récupération des données depuis Harmonic API" },
        { status: 500 }
      );
    }

    const harmonicData = await harmonicResponse.json();
    
    // Extraction des informations importantes uniquement
    const simplifiedData = harmonicData.map((company: HarmonicCompany) => ({
      nom: company.name,
      description: company.description,
      date_creation: company.founded_date,
      nombre_employes: company.employee_count,
      financement_total: company.funding_total,
      site_web: company.website_domain,
      industrie: company.industry,
      localisation: {
        pays: company.location?.country,
        ville: company.location?.city,
      },
      linkedin: company.social_media?.linkedin_url,
    }));

    return NextResponse.json({
      success: true,
      data: simplifiedData
    });
    
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}