/**
 * Builds a one-page PDF with plain lines of text (US-27, scenario 2).
 *
 * @remarks
 * Temporary: it lets the receipt download work with the fake API and without
 * a PDF library. The real receipt comes from the RESTful API. Only ASCII text
 * is supported, so the lines must not have accents.
 * @param lines - Text lines, from top to bottom.
 */
export function buildReceiptPdf(lines: string[]): Blob {
  const escape = (text: string): string => text.replace(/[\\()]/g, (char) => `\\${char}`);
  const text = lines
    .map((line, index) => `${index === 0 ? '' : '0 -22 Td '}(${escape(line)}) Tj`)
    .join('\n');
  const content = `BT /F1 13 Tf 72 760 Td\n${text}\nET`;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R ' +
      '/Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}
