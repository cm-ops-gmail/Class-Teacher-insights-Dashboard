import { google } from "googleapis";
import { NextResponse } from "next/server";
import type { ClassEntry } from "@/lib/definitions";

// Function to parse spreadsheet URL
function getSheetId(url: string): string | null {
  const match = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(url);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  try {
    const { sheetUrl } = await request.json();

    if (!sheetUrl) {
      return NextResponse.json(
        { error: "Google Sheet URL is required." },
        { status: 400 }
      );
    }

    const spreadsheetId = getSheetId(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Invalid Google Sheet URL." },
        { status: 400 }
      );
    }

    // Check if API key is present
    if (!process.env.GOOGLE_SHEETS_API_KEY) {
      console.error("GOOGLE_SHEETS_API_KEY is not set in .env or .env.local");
      return NextResponse.json(
        {
          error: "Server configuration error: Missing Google Sheets API key.",
        },
        { status: 500 }
      );
    }

    const sheets = google.sheets({
      version: "v4",
      auth: process.env.GOOGLE_SHEETS_API_KEY,
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Central_Class_OPS",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "No data found in the 'Central_Class_OPS' sheet." },
        { status: 404 }
      );
    }

    const header = rows[0] as (keyof ClassEntry)[];
    const data = rows.slice(1).map((row, index) => {
      const entry: Partial<ClassEntry> = { id: String(index + 1) };
      header.forEach((key, i) => {
        const definitionKeys = Object.keys(
          {} as Record<keyof ClassEntry, any>
        );
        const matchingKey = definitionKeys.find(
          (k) => k.toLowerCase() === String(key).toLowerCase()
        ) as keyof ClassEntry | undefined;

        if (matchingKey) {
          (entry as any)[matchingKey] = row[i] || "";
        }
      });
      return entry as ClassEntry;
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching from Google Sheet:", error);

    if (error.response?.data?.error) {
      const googleError = error.response.data.error;
      let userMessage = `Google API Error: ${googleError.message}`;
      if (googleError.code === 403) {
        userMessage =
          "Permission denied. Please make sure your Google Sheet is public ('Anyone with the link can view') and the API key is correct.";
      } else if (googleError.code === 404) {
        userMessage = "Spreadsheet not found. Please double-check the URL.";
      }
      return NextResponse.json({ error: userMessage }, { status: googleError.code });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while fetching data from the sheet." },
      { status: 500 }
    );
  }
}
