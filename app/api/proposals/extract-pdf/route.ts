import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import pdfParse from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No PDF file provided'
        },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        {
          success: false,
          error: 'File must be a PDF'
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const data = await pdfParse(buffer);
    const extractedText = data.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No readable text found in PDF'
        },
        { status: 400 }
      );
    }

    // Clean up extracted text
    const cleanedText = extractedText
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/\s{3,}/g, ' ') // Remove excessive spaces
      .trim();

    return NextResponse.json({
      success: true,
      content: cleanedText,
      message: 'PDF text extracted successfully',
      metadata: {
        pages: data.numpages,
        info: data.info
      }
    });

  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extract text from PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}