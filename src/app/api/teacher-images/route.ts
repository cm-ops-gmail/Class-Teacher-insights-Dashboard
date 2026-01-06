
import { google } from "googleapis";
import { NextResponse } from "next/server";

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
      range: "Sheet29",
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) { 
      return NextResponse.json(
        { error: "No data found in 'Sheet29'." },
        { status: 404 }
      );
    }
    
    const header = rows[0].map((h: string) => h.toLowerCase().trim());
    const teacherNameIndex = header.indexOf('teacher name');
    const pictureIndex = header.indexOf('picture');

    if (teacherNameIndex === -1 || pictureIndex === -1) {
        return NextResponse.json(
            { error: "Required columns 'Teacher Name' or 'Picture' not found in 'Sheet29'." },
            { status: 400 }
        );
    }

    const imageMap: { [key: string]: string } = {};
    rows.slice(1).forEach(row => {
        const teacherName = row[teacherNameIndex];
        let pictureUrl = row[pictureIndex];
        if (teacherName && pictureUrl) {
            // Transform Google Drive URL if necessary
            const fileIdMatch = pictureUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch) {
                const fileId = fileIdMatch[1];
                pictureUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
            }
            imageMap[teacherName.trim()] = pictureUrl;
        }
    });

    return NextResponse.json(imageMap);
  } catch (error: any) {
    console.error("Error fetching from Google Sheet (Sheet29):", error);
    let userMessage = "An unexpected error occurred while fetching teacher images.";
    let statusCode = 500;
     if (error.errors) {
        const googleError = error.errors[0];
        userMessage = `Google API Error: ${googleError.message}`;
        if (googleError.reason === 'forbidden') {
            statusCode = 403;
            userMessage = "Permission denied for 'Sheet29'.";
        } else if (googleError.reason === 'notFound') {
            statusCode = 404;
            userMessage = "Spreadsheet or 'Sheet29' not found.";
        }
    }
    return NextResponse.json({ error: userMessage }, { status: statusCode });
  }
}
