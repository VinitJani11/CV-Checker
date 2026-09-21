export async function parseCvFile(file) {
  if (!file) throw new Error('Choose a file first.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Please use a file smaller than 12 MB.');
  const ext = file.name.split('.').pop().toLowerCase();
  const signals = { source: ext, tables: 0, extractionWarnings: [] };

  if (ext === 'txt') return { text: await file.text(), signals };
  if (ext === 'docx') {
    if (!window.mammoth) throw new Error('The DOCX reader could not load. Check your internet connection and try again.');
    const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    signals.extractionWarnings = result.messages.map(message => message.message);
    return { text: result.value, signals };
  }
  if (ext === 'pdf') {
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
    let pdf;
    try { pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise; }
    catch (error) { throw new Error(/password/i.test(error.message) ? 'This PDF is password-protected.' : 'The PDF could not be read. Try saving it as a new PDF or use DOCX/TXT.'); }
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str).join(' '));
    }
    signals.pages = pdf.numPages;
    signals.extractionWarnings.push('PDF visual layout cannot be fully assessed from extracted text.');
    return { text: pages.join('\n\n'), signals };
  }
  throw new Error('Unsupported file type. Choose PDF, DOCX or TXT.');
}
