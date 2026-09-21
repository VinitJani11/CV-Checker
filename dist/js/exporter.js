function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportTxt(text) {
  download(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'tailored-cv.txt');
}

const xmlEscape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function exportDocx(text) {
  if (!window.JSZip) throw new Error('The DOCX exporter could not load. Check your connection and try again.');
  const zip = new window.JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  const paragraphs = text.split('\n').map(line => `<w:p><w:pPr><w:spacing w:after="100"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r></w:p>`).join('');
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`);
  download(await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'tailored-cv.docx');
}

export function printPdf(text) {
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) throw new Error('Allow pop-ups to use Print / PDF.');
  popup.document.write(`<title>Tailored CV</title><style>@page{margin:18mm}body{font:11pt/1.45 Arial,sans-serif;color:#111;white-space:pre-wrap;max-width:800px;margin:auto}h1{font-size:18pt}</style><body>${xmlEscape(text)}</body>`);
  popup.document.close(); popup.focus(); setTimeout(() => popup.print(), 250);
}
