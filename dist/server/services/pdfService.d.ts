import { IProposal } from '../types';
export declare class PDFService {
    private cleanMarkdown;
    private generateHTML;
    generatePDF(proposal: IProposal): Promise<Buffer>;
    generatePDFBuffer(proposal: IProposal): Promise<Buffer>;
    extractTextFromPDF(filePath: string): Promise<string>;
    extractTextFromBuffer(buffer: Buffer): Promise<string>;
}
export declare const pdfService: PDFService;
//# sourceMappingURL=pdfService.d.ts.map