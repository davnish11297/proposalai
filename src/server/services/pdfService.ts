import puppeteer from 'puppeteer';
import { IProposal } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class PDFService {
  private cleanMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert bold to HTML
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert italic to HTML
      .replace(/`(.*?)`/g, '<code>$1</code>') // Convert code to HTML
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/\n\s*[-*+]\s/g, '\n• ') // Normalize list markers
      .replace(/\n\s*\d+\.\s/g, '\n1. '); // Normalize numbered lists
  }

  private async generateHTML(proposal: IProposal): Promise<string> {
    // Parse content if it's a string
    let content: any;
    try {
      content = typeof proposal.content === 'string' ? JSON.parse(proposal.content) : proposal.content;
    } catch (error) {
      content = {};
    }
    
    // Parse metadata if it's a string
    let metadata: any;
    try {
      metadata = typeof proposal.metadata === 'string' ? JSON.parse(proposal.metadata) : proposal.metadata;
    } catch (error) {
      metadata = {};
    }

    // Debug logging
    console.log('📄 PDF Service Debug:', {
      title: proposal.title,
      contentType: typeof proposal.content,
      contentKeys: Object.keys(content),
      executiveSummaryLength: content?.executiveSummary?.length || 0,
      approachLength: content?.approach?.length || 0,
      budgetDetailsLength: content?.budgetDetails?.length || 0,
      timelineLength: content?.timeline?.length || 0,
      budget: content?.budget || 'not set'
    });
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${proposal.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
          }
          
          .header h1 {
            font-size: 32px;
            color: #1e40af;
            margin-bottom: 10px;
            font-weight: 700;
          }
          
          .header .subtitle {
            font-size: 18px;
            color: #6b7280;
            font-weight: 400;
          }
          
          .client-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #2563eb;
          }
          
          .client-info h3 {
            color: #1e40af;
            margin-bottom: 10px;
            font-size: 18px;
          }
          
          .client-info p {
            margin: 5px 0;
            color: #4b5563;
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section h2 {
            color: #1e40af;
            font-size: 24px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            font-weight: 600;
          }
          
          .section h3 {
            color: #374151;
            font-size: 20px;
            margin: 20px 0 10px 0;
            font-weight: 600;
          }
          
          .section p {
            margin-bottom: 15px;
            text-align: justify;
            color: #4b5563;
          }
          
          .budget-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .budget-table th,
          .budget-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .budget-table th {
            background: #2563eb;
            color: white;
            font-weight: 600;
          }
          
          .budget-table tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .budget-table tr:last-child {
            font-weight: 600;
            background: #1e40af;
            color: white;
          }
          
          .timeline {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          
          .timeline-item {
            display: flex;
            margin-bottom: 15px;
            align-items: flex-start;
          }
          
          .timeline-marker {
            width: 12px;
            height: 12px;
            background: #2563eb;
            border-radius: 50%;
            margin-right: 15px;
            margin-top: 6px;
            flex-shrink: 0;
          }
          
          .timeline-content h4 {
            color: #1e40af;
            margin-bottom: 5px;
            font-weight: 600;
          }
          
          .timeline-content p {
            color: #6b7280;
            margin: 0;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${proposal.title}</h1>
          <div class="subtitle">Professional Proposal</div>
        </div>
        
        <div class="client-info">
          <h3>Client Information</h3>
          <p><strong>Client:</strong> ${proposal.clientName || 'Not specified'}</p>
          ${proposal.clientEmail ? `<p><strong>Email:</strong> ${proposal.clientEmail}</p>` : ''}
          ${metadata?.industry ? `<p><strong>Industry:</strong> ${metadata.industry}</p>` : ''}
          ${metadata?.companySize ? `<p><strong>Company Size:</strong> ${metadata.companySize}</p>` : ''}
          ${metadata?.projectScope ? `<p><strong>Project Scope:</strong> ${metadata.projectScope}</p>` : ''}
        </div>
        
        ${content?.executiveSummary ? `
        <div class="section">
          <h2>Executive Summary</h2>
          <div>${this.cleanMarkdown(content.executiveSummary).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        
        ${content?.approach ? `
        <div class="section">
          <h2>Approach & Methodology</h2>
          <div>${this.cleanMarkdown(content.approach).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        
        ${content?.budgetDetails ? `
        <div class="section">
          <h2>Budget Details</h2>
          <div>${this.cleanMarkdown(content.budgetDetails).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        
        ${content?.timeline ? `
        <div class="section">
          <h2>Project Timeline</h2>
          <div>${this.cleanMarkdown(content.timeline).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        
        ${content?.budget ? `
        <div class="section">
          <h2>Investment Summary</h2>
          <p><strong>Total Investment:</strong> ${this.cleanMarkdown(content.budget)}</p>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Generated by ProposalAI | ${new Date().toLocaleDateString()}</p>
          <p>This proposal is valid for 30 days from the date of issue.</p>
        </div>
      </body>
      </html>
    `;
  }

  async generatePDF(proposal: IProposal): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      const html = await this.generateHTML(proposal);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        displayHeaderFooter: false
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  async generatePDFBuffer(proposal: IProposal): Promise<Buffer> {
    return await this.generatePDF(proposal);
  }

  /**
   * Extract text content from a PDF file
   */
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      // For now, we'll use a simple approach with pdf-parse
      // You may need to install: npm install pdf-parse
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from uploaded PDF buffer
   */
  async extractTextFromBuffer(buffer: Buffer): Promise<string> {
    try {
      // For now, we'll use a simple approach with pdf-parse
      // You may need to install: npm install pdf-parse
      const pdfParse = require('pdf-parse');
      
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (error) {
      console.error('Error extracting text from PDF buffer:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }
}

export const pdfService = new PDFService(); 