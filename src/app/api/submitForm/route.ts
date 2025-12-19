import { google } from 'googleapis';
import { NextResponse } from 'next/server';

type SheetForm = {
  email: string;
  address: string;
  pastExperience: string;
  images?: string[];
};

// Handle POST requests
export async function POST(req: Request) {
  try {
    const body: SheetForm = await req.json();
    // Received body

    if (!body.email || !body.address || !body.pastExperience) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const sheets = google.sheets({ auth, version: 'v4' });

    const imageLinks = body.images ? body.images.join(", ") : "No images uploaded"

    const response = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: 'Sheet1!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[body.email, body.address, body.pastExperience, imageLinks]],
        },
      });
      

          // Google Sheets API response
    return NextResponse.json({ message: 'Data submitted successfully', data: response.data }, { status: 200 });

} catch (e: unknown) {
    if (e instanceof Error) {
      console.error('Error while submitting data to Google Sheets:', e.message);
      return NextResponse.json({ message: 'Error submitting data', error: e.message }, { status: 500 });
    }
    
    console.error('Unexpected error:', e);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
