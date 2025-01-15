import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const website = formData.get("website") as string;
    const apiKey = process.env.HARMONIC_KEY;
    console.log(apiKey);
    if (!website) {
      return NextResponse.json(
        { error: "Website not provided" },
        { status: 400 }
      );
    }

    // Call the Harmonic API with the provided website
    const url = `https://api.harmonic.ai/companies?website_domain=${website}&apikey=${apiKey}`;
    console.log(url)
    const harmonicResponse = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json"
      }
    });

    console.log(harmonicResponse);

    // Check if the request was successful
    if (!harmonicResponse) {
      return NextResponse.json(
        { error: "Failed to fetch data from Harmonic API" },
        { status: 500 }
      );
    }

    const harmonicData = await harmonicResponse.json();

    // Return the result from Harmonic API
    return NextResponse.json({
      success: true,
      data: harmonicData
    });
    
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error" },
      { status: 500 }
    );
  }
}
