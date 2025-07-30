import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import User from '@/models/User';
import Organization from '@/models/Organization';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await connectDB();

    // Get proposal
    const proposal = await Proposal.findOne({
      _id: params.id,
      organizationId: userAuth.organizationId
    });

    if (!proposal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal not found'
        },
        { status: 404 }
      );
    }

    // Get user and organization info
    const user = await User.findById(userAuth.userId);
    const organization = await Organization.findById(userAuth.organizationId);

    if (!user || !organization) {
      return NextResponse.json(
        {
          success: false,
          error: 'User or organization not found'
        },
        { status: 404 }
      );
    }

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${proposal.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 2.5em;
          }
          .header .org-name {
            color: #6b7280;
            font-size: 1.2em;
            margin-top: 10px;
          }
          .proposal-title {
            font-size: 2em;
            color: #1f2937;
            margin: 30px 0 20px 0;
            text-align: center;
          }
          .content {
            white-space: pre-wrap;
            font-size: 1.1em;
            line-height: 1.8;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
          }
          h1, h2, h3 {
            color: #1f2937;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          h1 { font-size: 1.8em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.3em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${organization.name}</h1>
          <div class="org-name">Professional Proposal</div>
        </div>
        
        <h2 class="proposal-title">${proposal.title}</h2>
        
        <div class="content">${proposal.content}</div>
        
        <div class="footer">
          <p>Prepared by: ${user.firstName} ${user.lastName}</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>© ${organization.name} - All rights reserved</p>
        </div>
      </body>
      </html>
    `;

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();

    // Update proposal download tracking
    await Proposal.findByIdAndUpdate(proposal._id, {
      $push: {
        downloads: {
          downloadedAt: new Date(),
          format: 'PDF',
          downloaderIP: request.ip || 'unknown'
        }
      }
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate PDF'
      },
      { status: 500 }
    );
  }
}