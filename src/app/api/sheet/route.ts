
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

    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_PRIVATE_KEY
    ) {
      console.error("Google service account credentials are not set in .env.local");
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
      range: "Central_Class_OPS",
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) { // Need at least a header and one data row
      return NextResponse.json(
        { error: "No data found in the 'Central_Class_OPS' sheet." },
        { status: 404 }
      );
    }

    const header = rows[0].map(h => h.trim());
    const classEntryKeys = Object.keys(initialClassEntry) as (keyof ClassEntry)[];
    
    // Create a map from spreadsheet header to ClassEntry key
    const headerMap: { [key: string]: keyof ClassEntry } = {};
    const lowerCaseKeyMap = new Map(classEntryKeys.map(k => [k.toLowerCase().replace(/[^a-z0-9]/gi, ''), k]));

    header.forEach((h) => {
        const normalizedHeader = h.toLowerCase().replace(/[^a-z0-9]/gi, '');
        if (lowerCaseKeyMap.has(normalizedHeader)) {
            headerMap[h] = lowerCaseKeyMap.get(normalizedHeader)!;
        }
    });

    const data = rows.slice(1).map((row, index) => {
      const entry: Partial<ClassEntry> = { id: String(index + 1) };
      header.forEach((headerName, i) => {
        const key = headerMap[headerName];
        if (key) {
            (entry as any)[key] = row[i] || "";
        }
      });
      // Fill any missing keys with empty strings
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
const initialClassEntry: ClassEntry = {
  id: '',
  date: '',
  scheduledTime: '',
  entryTime: '',
  slideQAC: '',
  classStartTime: '',
  productType: '',
  course: '',
  subject: '',
  topic: '',
  teacher1: '',
  teacher2: '',
  teacher3: '',
  studio: '',
  studioCoordinator: '',
  opsStakeholder: '',
  lectureSlide: '',
  title: '',
  caption: '',
  crossPost: '',
  sourcePlatform: '',
  teacherConfirmation: '',
  zoomLink: '',
  zoomCredentials: '',
  moderatorLink: '',
  annotatedSlideLink: '',
  classStopTimestamps: '',
  startDelayMinutes: '',
  totalDurationMinutes: '',
  viewCount10Min: '',
  viewCount40_50Min: '',
  viewCountBeforeEnd: '',
  highestAttendance: '',
  averageAttendance: '',
  totalComments: '',
  classLink: '',
  recordingLink: '',
  classQACFeedback: '',
  remarks: '',
};
