/**
 * Generates single-page formal application dossiers for architectural inquiries and project briefs.
 * Compatible with Microsoft Word (.doc) and PDF printing.
 */
import { escapeHtml, briefEntries } from './planner.js';
import { OWNER_EMAILS } from './notify.js';

/** Generates a complete 1-page Microsoft Word (.doc) document for an architectural contact inquiry. */
export function generateInquiryDocHtml({ name, email, phone, studio, type, message, refId, filingDate }) {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Sri Akil — Architectural Inquiry Dossier (${escapeHtml(refId)})</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
      mso-page-orientation: portrait;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .dossier-wrapper {
      max-width: 720px;
      margin: 0 auto;
      border: 2px solid #b8860b;
      padding: 24px 28px;
      background: #ffffff;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #b8860b;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand-title {
      font-size: 16pt;
      font-weight: bold;
      color: #7c5806;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 9pt;
      color: #555555;
      margin: 3px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ref-badge {
      background: #faf4e6;
      border: 1px solid #d4af37;
      padding: 6px 14px;
      text-align: right;
    }
    .ref-label {
      font-size: 7.5pt;
      color: #777777;
      text-transform: uppercase;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .ref-num {
      font-size: 12pt;
      font-weight: bold;
      color: #7c5806;
    }
    .status-strip {
      background: #fdfaf2;
      border: 1px solid #e8dbb5;
      padding: 8px 12px;
      font-size: 9pt;
      color: #554411;
      margin-bottom: 14px;
    }
    .section-head {
      font-size: 11pt;
      font-weight: bold;
      color: #7c5806;
      border-bottom: 1px solid #d4af37;
      padding-bottom: 3px;
      margin-top: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #e6dcbf;
      padding: 7px 11px;
      font-size: 9.5pt;
      vertical-align: top;
    }
    table.data-table th {
      background-color: #faf5e8;
      color: #5c4206;
      width: 32%;
      font-weight: bold;
    }
    table.data-table td {
      background-color: #ffffff;
      color: #1a1a1a;
    }
    .vision-box {
      background: #fafafa;
      border: 1px solid #e5e5e5;
      padding: 10px 12px;
      font-size: 9.5pt;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .sla-note {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #d4af37;
      font-size: 8.5pt;
      color: #555555;
      line-height: 1.4;
    }
    .footer-table {
      width: 100%;
      margin-top: 16px;
      border-collapse: collapse;
    }
    .footer-table td {
      border: none;
      padding: 0;
      font-size: 8.5pt;
      color: #444444;
      vertical-align: top;
    }
  </style>
</head>
<body>
  <div class="dossier-wrapper">
    <table class="header-table">
      <tr>
        <td style="border:none; vertical-align:middle;">
          <h1 class="brand-title">SRI AKIL TEMPLE ARCHITECTURE</h1>
          <p class="brand-subtitle">Canonical Agama &amp; Dravidian Lithic Architecture Desk</p>
        </td>
        <td style="border:none; text-align:right; vertical-align:middle; width:220px;">
          <div class="ref-badge">
            <div class="ref-label">Official Inquiry Dossier</div>
            <div class="ref-num">${escapeHtml(refId)}</div>
          </div>
        </td>
      </tr>
    </table>

    <div class="status-strip">
      <strong>Dispatched to Principal Architect:</strong> ${escapeHtml(OWNER_EMAILS.join(', '))} &bull; 
      <strong>Filing Date:</strong> ${escapeHtml(filingDate)}
    </div>

    <div class="section-head">1. Patron &amp; Consultation Profile</div>
    <table class="data-table">
      <tr><th>Full Patron / Applicant Name</th><td><strong>${escapeHtml(name)}</strong></td></tr>
      <tr><th>Patron Email Address</th><td>${escapeHtml(email)}</td></tr>
      <tr><th>Direct Telephone</th><td>${escapeHtml(phone)}</td></tr>
      <tr><th>Designated Studio Desk</th><td>${escapeHtml(studio)}</td></tr>
    </table>

    <div class="section-head">2. Architectural Typology &amp; Land Vision</div>
    <table class="data-table">
      <tr><th>Sanctuary Typology</th><td><strong>${escapeHtml(type)}</strong></td></tr>
      <tr>
        <th>Land Location, Deity &amp; Vision Details</th>
        <td>
          <div class="vision-box">${escapeHtml(message)}</div>
        </td>
      </tr>
    </table>

    <div class="section-head">3. Sthapathi Desk Verification &amp; Advisory</div>
    <div class="sla-note">
      This document represents an official architectural consultation filing submitted to Sri Akil Temple Architecture. Our hereditary sthapathis and design leads will evaluate the site parameters, Agama shastra alignment, and lithic stone requirements, responding to <strong>${escapeHtml(email)}</strong> within 24–48 hours.
    </div>

    <table class="footer-table">
      <tr>
        <td style="width: 50%;">
          <strong>Verification Desk:</strong><br>
          Principal Sthapathi &amp; Architectural Director<br>
          Sri Akil Temple Architecture Guild
        </td>
        <td style="width: 50%; text-align: right;">
          <strong>Official Contact:</strong><br>
          enquiry@sriakil.com &bull; +91 44 2499 1234<br>
          Boat Club Road, Chennai &bull; Thanjavur Sacred Corridor
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/** Generates a complete 1-page Microsoft Word (.doc) document for a 6-Step Project Brief. */
export function generateBriefDocHtml(wizard, referenceId = '') {
  const fields = briefEntries(wizard);

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Sri Akil — Architectural Project Brief (${escapeHtml(referenceId)})</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { size: A4 portrait; margin: 18mm 16mm 18mm 16mm; }
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a1a1a; margin: 0; padding: 0; }
    .wrapper { max-width: 720px; margin: 0 auto; border: 2px solid #b8860b; padding: 24px 28px; background: #ffffff; }
    .header-table { width: 100%; border-collapse: collapse; border-bottom: 2px solid #b8860b; padding-bottom: 12px; margin-bottom: 14px; }
    .brand-title { font-size: 16pt; font-weight: bold; color: #7c5806; margin: 0; }
    .brand-subtitle { font-size: 9pt; color: #555555; margin: 3px 0 0 0; text-transform: uppercase; }
    .ref-badge { background: #faf4e6; border: 1px solid #d4af37; padding: 6px 14px; text-align: right; }
    .status-strip { background: #fdfaf2; border: 1px solid #e8dbb5; padding: 8px 12px; font-size: 9pt; color: #554411; margin-bottom: 14px; }
    .section-head { font-size: 11pt; font-weight: bold; color: #7c5806; border-bottom: 1px solid #d4af37; padding-bottom: 3px; margin: 14px 0 8px 0; text-transform: uppercase; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.data-table th, table.data-table td { border: 1px solid #e6dcbf; padding: 6px 10px; font-size: 9pt; vertical-align: top; }
    table.data-table th { background-color: #faf5e8; color: #5c4206; width: 34%; font-weight: bold; }
    table.data-table td { background-color: #ffffff; color: #1a1a1a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="header-table">
      <tr>
        <td style="border:none;">
          <h1 class="brand-title">SRI AKIL TEMPLE ARCHITECTURE</h1>
          <p class="brand-subtitle">Project Planning Brief &amp; Architectural Dossier</p>
        </td>
        <td style="border:none; text-align:right;">
          <div class="ref-badge">
            <div style="font-size:7.5pt; color:#777; text-transform:uppercase; font-weight:bold;">Project Brief Ref</div>
            <div style="font-size:12pt; font-weight:bold; color:#7c5806;">${escapeHtml(referenceId)}</div>
          </div>
        </td>
      </tr>
    </table>
    <div class="status-strip">
      <strong>Dispatched to Principal Architect:</strong> ${escapeHtml(OWNER_EMAILS.join(', '))} &bull; <strong>Reference:</strong> ${escapeHtml(referenceId)}
    </div>
    <div class="section-head">Architectural Project Specifications</div>
    <table class="data-table">
      ${fields.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
    </table>
  </div>
</body>
</html>`;
}

/** Triggers automatic download of a generated Word .doc file. */
export function downloadDocFile(filename, htmlContent) {
  // UTF-8 BOM ensures non-ASCII characters display properly in MS Word
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
