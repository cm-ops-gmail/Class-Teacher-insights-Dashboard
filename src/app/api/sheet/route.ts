
import { google } from "googleapis";
import { NextResponse } from "next/server";
import type { ClassEntry } from "@/lib/definitions";

// Function to parse spreadsheet URL
function getSheetId(url: string): string | null {
  const match = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(url);
  return match ? match[1] : null;
}

// Function to create a clean mapping key from a header string
const normalizeHeader = (header: string): string => {
    return header.toLowerCase().replace(/[^a-z0-9]/gi, '');
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

    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_PRIVATE_KEY
    ) {
      console.error("Google service account credentials are not set in .env");
      return NextResponse.json(
        {
          error:
            "Server configuration error: Missing Google service account credentials.",
        },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet28",
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) { // Need at least a header and one data row
      return NextResponse.json(
        { error: "No data found in the 'Sheet28' sheet." },
        { status: 404 }
      );
    }
    
    const header = rows[0].map(h => h.trim());
    const classEntryKeys = Object.keys(getInitialClassEntry()) as (keyof ClassEntry)[];
    
    // Create a map from a normalized header to the ClassEntry key
    const normalizedKeyMap = new Map(classEntryKeys.map(k => [normalizeHeader(k), k]));

    // Special mappings for headers that don't match the key names after normalization
    const specialHeaderMap: {[key: string]: keyof ClassEntry} = {
        'entrytimet45t30': 'entryTime',
        'slideqact15': 'slideQAC',
        'teacher2doubtsolver1': 'teacher2',
        'teacher3doubtsolver2': 'teacher3',
        'totalcommentsnumber': 'totalComments',
        'whichissueshaveyoufacedduringtheliveclass': 'liveClassIssues',
        'besidesmentionedissueshaveyouencounteredanyothertechnicalissues': 'otherTechnicalIssues',
        'onascalof1to5howsatisfiedareyouwithyourinstudioexperiencesatisfaction': 'satisfaction'
    };

    const headerMap: { [key: number]: keyof ClassEntry } = {};
    header.forEach((h, i) => {
        const normalizedHeader = normalizeHeader(h);
        if (specialHeaderMap[normalizedHeader]) {
             headerMap[i] = specialHeaderMap[normalizedHeader];
        } else if (normalizedKeyMap.has(normalizedHeader)) {
            headerMap[i] = normalizedKeyMap.get(normalizedHeader)!;
        }
    });

    const data = rows.slice(1).map((row, index) => {
      const entry: Partial<ClassEntry> = { id: String(index + 1) };
      row.forEach((cellValue, i) => {
          const key = headerMap[i];
          if (key) {
              (entry as any)[key] = cellValue || "";
          }
      });
      // Fill any missing keys with empty strings to ensure type consistency
      classEntryKeys.forEach(key => {
        if (!(key in entry)) {
          (entry as any)[key] = "";
        }
      });
      return entry as ClassEntry;
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching from Google Sheet:", error);

    let userMessage = "An unexpected error occurred while fetching data from the sheet.";
    let statusCode = 500;

    if (error.code === 'ENOTFOUND') {
        userMessage = "Could not connect to Google Sheets. Please check your network connection.";
        statusCode = 503; // Service Unavailable
    } else if (error.errors) {
        const googleError = error.errors[0];
        userMessage = `Google API Error: ${googleError.message}`;
        if (googleError.reason === 'forbidden') {
            statusCode = 403;
            userMessage = "Permission denied. Please make sure the service account has 'Viewer' access to the Google Sheet.";
        } else if (googleError.reason === 'notFound') {
            statusCode = 404;
            userMessage = "Spreadsheet not found. Please double-check the URL.";
        }
    }

    return NextResponse.json({ error: userMessage }, { status: statusCode });
  }
}

// Used to get all possible keys for mapping and default values
function getInitialClassEntry(): ClassEntry {
    return {
      id: '',
      date: '',
      scheduledTime: '',
      entryTime: '',
      slideQAC: '',
      classStartTime: '',
      productType: '',
      course: '',
      subject: '',
      teacher: '',
      teacher1Gmail: '',
      teacher2: '',
      teacher2Gmail: '',
      teacher3: '',
      teacher3Gmail: '',
      totalDuration: '',
      highestAttendance: '',
      averageAttendance: '',
      totalComments: '',
      issuesType: '',
      issuesDetails: '',
      slideCommunication: '',
      liveClassIssues: '',
      otherTechnicalIssues: '',
      satisfaction: '',
    };
}
