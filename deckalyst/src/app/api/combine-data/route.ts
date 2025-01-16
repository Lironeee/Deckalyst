import { NextResponse } from "next/server";
import { analyzePitchDeck } from "@/lib/analyze";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileData = (formData.get("fileData") as string) || "";
    const harmonicData = (formData.get("harmonicData") as string) || "";

    const analysis = await analyzePitchDeck(harmonicData, fileData);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while processing the request.",
      },
      { status: 500 }
    );
  }
}
