import { jsPDF } from 'jspdf';
import { briefEntries } from './planner.js';
import { OWNER_EMAILS, OWNER_WHATSAPP } from './notify.js';

/**
 * Creates a professional, publication-quality A4 PDF dossier for a 6-Step Project Brief.
 */
export function generateBriefPdf(wizard, referenceId = '') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = margin;

  // Outer Decorative Frame
  doc.setDrawColor(212, 175, 55); // Rich Gold
  doc.setLineWidth(0.8);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, doc.internal.pageSize.getHeight() - (margin - 4) * 2);

  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.3);
  doc.rect(margin - 2.5, margin - 2.5, contentWidth + 5, doc.internal.pageSize.getHeight() - (margin - 2.5) * 2);

  // Top Header Banner
  doc.setFillColor(250, 245, 232); // Ivory/Gold tint
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 24, 'S');

  // Crest / Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(112, 77, 10); // Deep Antique Gold
  doc.text('SRI AKIL TEMPLE ARCHITECTURE', margin + 5, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 80, 65);
  doc.text('CANONICAL AGAMA & DRAVIDIAN LITHIC ARCHITECTURE GUILD', margin + 5, y + 14);
  doc.text('Hereditary Sthapathi Desk | Chennai & Karaikudi Studios', margin + 5, y + 19);

  // Reference Badge on Right
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 58, y + 3, 54, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 110, 20);
  doc.text('OFFICIAL PROJECT BRIEF', pageWidth - margin - 55, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  doc.text(referenceId || 'SRI-BRIEF', pageWidth - margin - 55, y + 15);

  y += 28;

  // Subtitle Strip
  doc.setFillColor(245, 242, 235);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(90, 80, 65);
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`DISPATCH STATUS: FILED WITH STUDIO DESK  |  DATE: ${dateStr}  |  PRIMARY CONTACT: +91 99402 95932`, margin + 3, y + 4.8);
  y += 10;

  // Helper: Section Header
  function drawSectionHeader(title) {
    doc.setFillColor(238, 230, 210);
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setDrawColor(184, 134, 11);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(112, 77, 10);
    doc.text(title.toUpperCase(), margin + 3, y + 4.8);
    y += 8.5;
  }

  // Helper: Key Value Row
  function drawRow(label, value, isFullWidth = false) {
    const rowHeight = 7;
    doc.setDrawColor(230, 222, 205);
    doc.setLineWidth(0.2);

    doc.setFillColor(252, 250, 245);
    const labelWidth = isFullWidth ? 45 : 42;
    doc.rect(margin, y, labelWidth, rowHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(90, 75, 50);
    doc.text(label, margin + 2.5, y + 4.8);

    doc.setFillColor(255, 255, 255);
    const valueWidth = contentWidth - labelWidth;
    doc.rect(margin + labelWidth, y, valueWidth, rowHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    const safeVal = String(value || 'Not specified');
    const truncated = safeVal.length > 70 ? safeVal.substring(0, 67) + '...' : safeVal;
    doc.text(truncated, margin + labelWidth + 3, y + 4.8);

    y += rowHeight;
  }

  // 1. Patron & Trust Profile
  drawSectionHeader('1. Patron Credentials & Contact Information');
  drawRow('Patron / Trustee Name', wizard.patronName || 'Devotee / Patron');
  drawRow('Trust / Foundation', wizard.trustName || 'Private Commission');
  drawRow('Direct Phone / WhatsApp', wizard.phone || 'Provided via submission');
  drawRow('Email Address', wizard.email || 'Provided via submission');
  y += 3;

  // 2. Sacred Project Scope & Tradition
  drawSectionHeader('2. Sacred Architectural Specifications');
  drawRow('Project Typology', wizard.category);
  drawRow('Land Location / Region', wizard.location);
  drawRow('Site Acreage / Dimensions', wizard.acreage);
  drawRow('Architectural Tradition', wizard.style);
  drawRow('Presiding Deity (Moolavar)', wizard.deity);
  drawRow('Estimated Built Footprint', wizard.footprint);
  drawRow('Preferred Lithic Stone', wizard.stone);
  y += 3;

  // 3. Disciplines & Services Commissioned
  drawSectionHeader('3. Commissioned Architectural Disciplines');
  const servicesText = Array.isArray(wizard.services) && wizard.services.length
    ? wizard.services.join(', ')
    : 'Comprehensive Sanctuary Planning';
  drawRow('Disciplines Selected', servicesText, true);
  y += 3;

  // 4. Vision Notes & Remarks
  if (wizard.notes && wizard.notes.trim()) {
    drawSectionHeader('4. Vision, Traditions & Design Requirements');
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 222, 205);
    doc.setLineWidth(0.2);

    const splitNotes = doc.splitTextToSize(wizard.notes.trim(), contentWidth - 6);
    const boxHeight = Math.min(24, Math.max(12, splitNotes.length * 4.5 + 4));
    doc.rect(margin, y, contentWidth, boxHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(splitNotes.slice(0, 5), margin + 3, y + 5);
    y += boxHeight + 3;
  }

  // 5. Verification & Advisory Notice
  drawSectionHeader('5. Sthapathi Desk Verification & Formal Notice');
  doc.setFillColor(253, 250, 242);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  const noticeHeight = 16;
  doc.rect(margin, y, contentWidth, noticeHeight, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 50, 30);
  const noticeText = 'This document records a formal project planning brief filed with Sri Akil Temple Architecture. Our hereditary sthapathis, structural engineers, and Agama shastra consultants will review orientation, Ayadi Shadvarga metrics, and stone quarry feasibility. A dedicated sthapathi consultation will follow.';
  const wrappedNotice = doc.splitTextToSize(noticeText, contentWidth - 6);
  doc.text(wrappedNotice, margin + 3, y + 4.5);
  y += noticeHeight + 4;

  // Official Seal & Contact Footer
  const footerY = doc.internal.pageSize.getHeight() - margin - 15;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY, margin + contentWidth, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(112, 77, 10);
  doc.text('SRI AKIL SACRED ARCHITECTURAL STUDIO', margin, footerY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 85, 75);
  doc.text('Chennai Studio: 2/119, Nehru Nagar, Rajiv Gandhi Salai, Chemmancheri', margin, footerY + 8);
  doc.text('Karaikudi Guild: E-Ponnagar, Alagappapuram, Karaikudi', margin, footerY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(112, 77, 10);
  doc.text('Hotline: +91 99402 95932 / +91 97902 24561', pageWidth - margin - 65, footerY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 85, 75);
  doc.text(`Official Mail: ${OWNER_EMAILS[0]}`, pageWidth - margin - 65, footerY + 8);
  doc.text('Website: sri-akil-architecture.com', pageWidth - margin - 65, footerY + 11.5);

  return doc;
}

/**
 * Creates a professional 1-Page A4 PDF dossier for a Contact Page Inquiry.
 */
export function generateInquiryPdf(inquiry) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Outer Decorative Frame
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, doc.internal.pageSize.getHeight() - (margin - 4) * 2);

  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.3);
  doc.rect(margin - 2.5, margin - 2.5, contentWidth + 5, doc.internal.pageSize.getHeight() - (margin - 2.5) * 2);

  // Top Header Banner
  doc.setFillColor(250, 245, 232);
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 24, 'S');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(112, 77, 10);
  doc.text('SRI AKIL TEMPLE ARCHITECTURE', margin + 5, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 80, 65);
  doc.text('CANONICAL AGAMA & DRAVIDIAN LITHIC ARCHITECTURE GUILD', margin + 5, y + 14);
  doc.text('Hereditary Sthapathi Desk | Chennai & Karaikudi Studios', margin + 5, y + 19);

  // Inquiry Ref Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 58, y + 3, 54, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 110, 20);
  doc.text('ARCHITECTURAL INQUIRY', pageWidth - margin - 55, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  doc.text(inquiry.refId || 'AKIL-INQ', pageWidth - margin - 55, y + 15);

  y += 28;

  // Subtitle Strip
  doc.setFillColor(245, 242, 235);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(90, 80, 65);
  doc.text(`DISPATCHED TO: ${OWNER_EMAILS[0]}  |  FILING: ${inquiry.filingDate}  |  HOTLINE: +91 99402 95932`, margin + 3, y + 4.8);
  y += 11;

  // Helper Section Header
  function drawSectionHeader(title) {
    doc.setFillColor(238, 230, 210);
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setDrawColor(184, 134, 11);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(112, 77, 10);
    doc.text(title.toUpperCase(), margin + 3, y + 4.8);
    y += 8.5;
  }

  function drawRow(label, value) {
    const rowHeight = 7.5;
    doc.setDrawColor(230, 222, 205);
    doc.setLineWidth(0.2);

    doc.setFillColor(252, 250, 245);
    const labelWidth = 48;
    doc.rect(margin, y, labelWidth, rowHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(90, 75, 50);
    doc.text(label, margin + 2.5, y + 5);

    doc.setFillColor(255, 255, 255);
    const valueWidth = contentWidth - labelWidth;
    doc.rect(margin + labelWidth, y, valueWidth, rowHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(String(value || 'Not provided'), margin + labelWidth + 3, y + 5);

    y += rowHeight;
  }

  // 1. Patron Credentials
  drawSectionHeader('1. Patron Credentials & Application Profile');
  drawRow('Full Patron / Applicant Name', inquiry.name);
  drawRow('Patron Email Address', inquiry.email);
  drawRow('Direct Telephone / WhatsApp', inquiry.phone);
  drawRow('Designated Studio Desk', `${inquiry.studio} Studio Desk`);
  y += 4;

  // 2. Typology & Land Details
  drawSectionHeader('2. Sanctuary Typology & Scope of Commission');
  drawRow('Sanctuary Typology', inquiry.type);
  y += 4;

  // Message / Details Box
  drawSectionHeader('3. Project Vision, Land Specifications & Requirements');
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(230, 222, 205);
  doc.setLineWidth(0.2);

  const messageText = inquiry.message || 'No additional vision notes entered.';
  const splitMsg = doc.splitTextToSize(messageText, contentWidth - 8);
  const msgHeight = Math.min(50, Math.max(20, splitMsg.length * 5 + 6));
  doc.rect(margin, y, contentWidth, msgHeight, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(35, 35, 35);
  doc.text(splitMsg, margin + 4, y + 6);
  y += msgHeight + 5;

  // 4. Advisory Notice
  drawSectionHeader('4. Sthapathi Desk Verification & Formal Notice');
  doc.setFillColor(253, 250, 242);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  const advisoryHeight = 20;
  doc.rect(margin, y, contentWidth, advisoryHeight, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 50, 30);
  const advisoryNotice = `This official inquiry dossier has been submitted directly to the principal architects at Sri Akil Temple Architecture. Dispatched to the sthapathi desk (${OWNER_EMAILS[0]}). Our hereditary sthapathis and design leads will evaluate the architectural parameters, Agama canon, and stone requirements, responding to ${inquiry.email} within 24–48 hours.`;
  const wrappedAdvisory = doc.splitTextToSize(advisoryNotice, contentWidth - 6);
  doc.text(wrappedAdvisory, margin + 3, y + 5);
  y += advisoryHeight + 6;

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - margin - 15;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY, margin + contentWidth, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(112, 77, 10);
  doc.text('SRI AKIL SACRED ARCHITECTURAL STUDIO', margin, footerY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 85, 75);
  doc.text('Chennai Studio: 2/119, Nehru Nagar, Rajiv Gandhi Salai, Chemmancheri', margin, footerY + 8);
  doc.text('Karaikudi Guild: E-Ponnagar, Alagappapuram, Karaikudi', margin, footerY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(112, 77, 10);
  doc.text('Hotline: +91 99402 95932 / +91 97902 24561', pageWidth - margin - 65, footerY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 85, 75);
  doc.text(`Official Mail: ${OWNER_EMAILS[0]}`, pageWidth - margin - 65, footerY + 8);
  doc.text('Website: sri-akil-architecture.com', pageWidth - margin - 65, footerY + 11.5);

  return doc;
}

/**
 * Triggers instant browser download of the Brief PDF.
 */
export function downloadBriefPdf(wizard, referenceId = '') {
  const doc = generateBriefPdf(wizard, referenceId);
  const cleanId = (referenceId || 'draft').replace(/[^a-zA-Z0-9-]/g, '_');
  doc.save(`sri-akil-project-brief-${cleanId}.pdf`);
}

/**
 * Triggers instant browser download of the Contact Inquiry PDF.
 */
export function downloadInquiryPdf(inquiry) {
  const doc = generateInquiryPdf(inquiry);
  const cleanId = (inquiry.refId || 'inquiry').replace(/[^a-zA-Z0-9-]/g, '_');
  doc.save(`sri-akil-inquiry-dossier-${cleanId}.pdf`);
}
