/**
 * PDF Generation Utility for Policy Documents
 * Creates professional PDF documents with APS Lanka branding
 */

import jsPDF from 'jspdf';

interface PolicyData {
  id: string;
  title: string;
  description: string;
  content: string;
  version: string;
  createdDate: string;
  updatedDate: string;
  status: string;
  category: string;
  acknowledgedBy?: string[];
  totalUsers?: number;
}

interface UserInfo {
  name: string;
  email: string;
  department: string;
  role: string;
}

export class PolicyPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generate a professional PDF for a policy document
   */
  public generatePolicyPDF(policy: PolicyData, user: UserInfo): void {
    this.addHeader();
    this.addPolicyTitle(policy);
    this.addPolicyDetails(policy);
    this.addPolicyContent(policy);
    this.addFooter(user);
    this.downloadPDF(policy);
  }

  /**
   * Add APS Lanka header with branding
   */
  private addHeader(): void {
    const centerX = this.pageWidth / 2;

    // Company header
    this.doc.setFillColor(41, 128, 185); // Professional blue
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');

    // Company name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('APS LANKA', centerX, 15, { align: 'center' });

    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Cybersecurity Training & Compliance Platform', centerX, 25, { align: 'center' });

    // Reset color and position
    this.doc.setTextColor(0, 0, 0);
    this.currentY = 50;
  }

  /**
   * Add policy title section
   */
  private addPolicyTitle(policy: PolicyData): void {
    // Policy document title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 73, 94); // Dark blue-gray
    
    // Title with underline
    this.doc.text(policy.title, this.margin, this.currentY);
    const titleWidth = this.doc.getTextWidth(policy.title);
    this.doc.setDrawColor(52, 73, 94);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY + 2, this.margin + titleWidth, this.currentY + 2);
    
    this.currentY += 15;

    // Policy type badge
    this.doc.setFillColor(46, 204, 113); // Green for active
    this.doc.roundedRect(this.margin, this.currentY, 40, 8, 2, 2, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ACTIVE POLICY', this.margin + 20, this.currentY + 5.5, { align: 'center' });

    // Version info
    this.doc.setTextColor(127, 140, 141);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Version ${policy.version}`, this.margin + 50, this.currentY + 5.5);

    this.currentY += 20;
  }

  /**
   * Add policy metadata and details
   */
  private addPolicyDetails(policy: PolicyData): void {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(11);

    // Policy information box
    this.doc.setFillColor(236, 240, 241); // Light gray
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 45, 'F');
    
    // Border
    this.doc.setDrawColor(189, 195, 199);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 45);

    const infoY = this.currentY + 10;
    const col1X = this.margin + 10;
    const col2X = this.pageWidth / 2 + 10;

    // Left column
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Category:', col1X, infoY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.formatCategory(policy.category), col1X + 25, infoY);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Status:', col1X, infoY + 8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(policy.status.toUpperCase(), col1X + 25, infoY + 8);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Created:', col1X, infoY + 16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.formatDate(policy.createdDate), col1X + 25, infoY + 16);

    // Right column
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Last Updated:', col2X, infoY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.formatDate(policy.updatedDate), col2X + 35, infoY);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Document ID:', col2X, infoY + 8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(policy.id.substring(0, 12) + '...', col2X + 35, infoY + 8);

    // Download timestamp
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Downloaded:', col2X, infoY + 16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(new Date().toLocaleDateString(), col2X + 35, infoY + 16);

    this.currentY += 60;
  }

  /**
   * Add policy content with proper formatting
   */
  private addPolicyContent(policy: PolicyData): void {
    // Description section
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 73, 94);
    this.doc.text('Policy Description', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    // Wrap description text
    const descLines = this.doc.splitTextToSize(policy.description, this.pageWidth - (2 * this.margin));
    this.doc.text(descLines, this.margin, this.currentY);
    this.currentY += (descLines.length * 6) + 15;

    // Content section
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 73, 94);
    this.doc.text('Policy Content', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);

    // Wrap content text
    const contentLines = this.doc.splitTextToSize(policy.content, this.pageWidth - (2 * this.margin));
    
    // Check if we need a new page
    if (this.currentY + (contentLines.length * 6) > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = 30;
    }

    this.doc.text(contentLines, this.margin, this.currentY);
    this.currentY += (contentLines.length * 6) + 20;

    // Add compliance notice
    this.addComplianceNotice();
  }

  /**
   * Add compliance and acknowledgment notice
   */
  private addComplianceNotice(): void {
    // Check if we need a new page for the notice
    if (this.currentY > this.pageHeight - 70) {
      this.doc.addPage();
      this.currentY = 30;
    }

    // Notice box
    this.doc.setFillColor(241, 196, 15); // Warning yellow
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 35, 'F');
    
    this.doc.setDrawColor(243, 156, 18);
    this.doc.setLineWidth(1);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 35);

    // Notice text
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('⚠️ COMPLIANCE NOTICE', this.margin + 10, this.currentY + 10);

    this.doc.setFont('helvetica', 'normal');
    const noticeText = 'This policy document is property of APS Lanka. All employees are required to read, understand, and comply with the contents of this policy. Failure to comply may result in disciplinary action.';
    const noticeLines = this.doc.splitTextToSize(noticeText, this.pageWidth - (2 * this.margin) - 20);
    this.doc.text(noticeLines, this.margin + 10, this.currentY + 18);

    this.currentY += 50;
  }

  /**
   * Add footer with user information and download details
   */
  private addFooter(user: UserInfo): void {
    const footerY = this.pageHeight - 30;

    // Footer separator line
    this.doc.setDrawColor(189, 195, 199);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10);

    // Footer text
    this.doc.setFontSize(9);
    this.doc.setTextColor(127, 140, 141);
    this.doc.setFont('helvetica', 'normal');

    // Left side - User info
    this.doc.text(`Downloaded by: ${user.name} (${user.email})`, this.margin, footerY);
    this.doc.text(`Department: ${user.department} | Role: ${user.role}`, this.margin, footerY + 6);

    // Right side - Timestamp and page
    const rightText = `Downloaded on: ${new Date().toLocaleString()}`;
    this.doc.text(rightText, this.pageWidth - this.margin, footerY, { align: 'right' });
    
    const pageText = `Page 1 of ${this.doc.getNumberOfPages()}`;
    this.doc.text(pageText, this.pageWidth - this.margin, footerY + 6, { align: 'right' });

    // Center - Company confidentiality notice
    const confidentialText = 'CONFIDENTIAL - APS Lanka Internal Use Only';
    this.doc.setFont('helvetica', 'italic');
    this.doc.text(confidentialText, this.pageWidth / 2, footerY + 12, { align: 'center' });
  }

  /**
   * Download the generated PDF
   */
  private downloadPDF(policy: PolicyData): void {
    const fileName = `APS_Lanka_Policy_${policy.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(fileName);
  }

  /**
   * Format category for display
   */
  private formatCategory(category: string): string {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}

/**
 * Convenience function to generate and download policy PDF
 */
export function downloadPolicyPDF(policy: PolicyData, user: UserInfo): void {
  const generator = new PolicyPDFGenerator();
  generator.generatePolicyPDF(policy, user);
}